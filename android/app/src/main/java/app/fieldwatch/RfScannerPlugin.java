package app.fieldwatch;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.bluetooth.le.BluetoothLeScanner;
import android.bluetooth.le.ScanCallback;
import android.bluetooth.le.ScanResult;
import android.bluetooth.le.ScanSettings;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.location.LocationManager;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.SparseArray;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.PermissionState;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CapacitorPlugin(
    name = "RfScanner",
    permissions = {
        @Permission(
            alias = "location",
            strings = {
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION
            }
        ),
        @Permission(
            alias = "bluetoothNew",
            strings = {
                Manifest.permission.BLUETOOTH_SCAN,
                Manifest.permission.BLUETOOTH_CONNECT
            }
        )
    }
)
public class RfScannerPlugin extends Plugin {

    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    private WifiManager wifiManager;
    private BroadcastReceiver wifiReceiver;
    private boolean isWifiScanning = false;
    private Runnable wifiScanRunnable;

    private BluetoothAdapter bluetoothAdapter;
    private BluetoothLeScanner bleScanner;
    private ScanCallback bleScanCallback;
    private boolean isBleScanning = false;
    private final Map<String, JSObject> bleBuffer = new HashMap<>();
    private Runnable bleFlushRunnable;

    @PluginMethod
    public void requestPerms(PluginCall call) {
        boolean hasLocation = ContextCompat.checkSelfPermission(
            getContext(),
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED;

        boolean hasBle = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            hasBle = ContextCompat.checkSelfPermission(
                getContext(),
                Manifest.permission.BLUETOOTH_SCAN
            ) == PackageManager.PERMISSION_GRANTED;
        }

        if (hasLocation && hasBle) {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            ret.put("locationGranted", true);
            ret.put("bleGranted", true);
            call.resolve(ret);
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            requestPermissionForAliases(new String[]{"location", "bluetoothNew"}, call, "permsCallback");
        } else {
            requestPermissionForAlias("location", call, "permsCallback");
        }
    }

    @PermissionCallback
    private void permsCallback(PluginCall call) {
        boolean locationGranted = getPermissionState("location") == PermissionState.GRANTED;
        boolean bleGranted = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            bleGranted = getPermissionState("bluetoothNew") == PermissionState.GRANTED;
        }

        JSObject ret = new JSObject();
        ret.put("granted", locationGranted && bleGranted);
        ret.put("locationGranted", locationGranted);
        ret.put("bleGranted", bleGranted);
        call.resolve(ret);
    }

    @PluginMethod
    public void start(PluginCall call) {
        boolean enableWifi = call.getBoolean("wifi", true);
        boolean enableBle = call.getBoolean("ble", true);

        LocationManager lm = (LocationManager) getContext().getSystemService(Context.LOCATION_SERVICE);
        boolean locationEnabled = lm != null && (lm.isProviderEnabled(LocationManager.GPS_PROVIDER) || lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER));

        BluetoothManager bm = (BluetoothManager) getContext().getSystemService(Context.BLUETOOTH_SERVICE);
        bluetoothAdapter = bm != null ? bm.getAdapter() : null;
        boolean bluetoothEnabled = bluetoothAdapter != null && bluetoothAdapter.isEnabled();

        if (enableWifi) {
            startWifiScan();
        }

        if (enableBle && bluetoothEnabled) {
            startBleScan();
        }

        JSObject ret = new JSObject();
        ret.put("wifi", isWifiScanning);
        ret.put("ble", isBleScanning);
        ret.put("locationEnabled", locationEnabled);
        ret.put("bluetoothEnabled", bluetoothEnabled);
        call.resolve(ret);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        stopAllScanning();
        if (call != null) {
            call.resolve();
        }
    }

    private synchronized void startWifiScan() {
        if (isWifiScanning) return;

        Context context = getContext().getApplicationContext();
        wifiManager = (WifiManager) context.getSystemService(Context.WIFI_SERVICE);
        if (wifiManager == null) return;

        wifiReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context ctx, Intent intent) {
                if (WifiManager.SCAN_RESULTS_AVAILABLE_ACTION.equals(intent.getAction())) {
                    try {
                        List<android.net.wifi.ScanResult> results = wifiManager.getScanResults();
                        if (results != null && !results.isEmpty()) {
                            JSArray list = new JSArray();
                            for (android.net.wifi.ScanResult res : results) {
                                if (res.BSSID == null) continue;
                                JSObject item = new JSObject();
                                item.put("kind", "WIFI");
                                item.put("mac", res.BSSID.toUpperCase());
                                String ssid = res.SSID != null ? res.SSID : "";
                                item.put("ssid", ssid);
                                item.put("name", !ssid.isEmpty() ? ssid : "Wi-Fi AP");
                                item.put("rssi", res.level);
                                item.put("frequency", res.frequency);
                                list.put(item);
                            }

                            if (list.length() > 0) {
                                JSObject payload = new JSObject();
                                payload.put("devices", list);
                                notifyListeners("devices", payload);
                            }
                        }
                    } catch (SecurityException ignored) {
                    }
                }
            }
        };

        IntentFilter filter = new IntentFilter(WifiManager.SCAN_RESULTS_AVAILABLE_ACTION);
        int flags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU ? ContextCompat.RECEIVER_EXPORTED : 0;
        ContextCompat.registerReceiver(context, wifiReceiver, filter, flags);
        isWifiScanning = true;

        wifiScanRunnable = new Runnable() {
            @Override
            public void run() {
                if (!isWifiScanning || wifiManager == null) return;
                try {
                    wifiManager.startScan();
                } catch (Exception ignored) {
                }
                mainHandler.postDelayed(this, 10000); // Trigger every 10 seconds (standard Android scan interval)
            }
        };

        // Run initial scan immediately
        mainHandler.post(wifiScanRunnable);
    }

    private synchronized void startBleScan() {
        if (isBleScanning || bluetoothAdapter == null || !bluetoothAdapter.isEnabled()) return;

        bleScanner = bluetoothAdapter.getBluetoothLeScanner();
        if (bleScanner == null) return;

        bleScanCallback = new ScanCallback() {
            @Override
            public void onScanResult(int callbackType, ScanResult result) {
                if (result == null) return;
                BluetoothDevice dev = result.getDevice();
                if (dev == null || dev.getAddress() == null) return;

                String mac = dev.getAddress().toUpperCase();
                int rssi = result.getRssi();

                String name = null;
                if (result.getScanRecord() != null) {
                    name = result.getScanRecord().getDeviceName();
                }
                if (name == null || name.isEmpty()) {
                    try {
                        name = dev.getName();
                    } catch (SecurityException ignored) {
                    }
                }

                Integer mfrId = null;
                if (result.getScanRecord() != null && result.getScanRecord().getManufacturerSpecificData() != null) {
                    SparseArray<byte[]> mfrData = result.getScanRecord().getManufacturerSpecificData();
                    if (mfrData.size() > 0) {
                        mfrId = mfrData.keyAt(0);
                    }
                }

                JSObject obj = new JSObject();
                obj.put("kind", "BLE");
                obj.put("mac", mac);
                obj.put("rssi", rssi);
                if (name != null && !name.isEmpty()) {
                    obj.put("name", name);
                }
                if (mfrId != null) {
                    obj.put("mfrId", mfrId);
                }

                synchronized (bleBuffer) {
                    bleBuffer.put(mac, obj);
                }
            }

            @Override
            public void onScanFailed(int errorCode) {
                super.onScanFailed(errorCode);
            }
        };

        ScanSettings settings = new ScanSettings.Builder()
            .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
            .build();

        try {
            bleScanner.startScan(null, settings, bleScanCallback);
            isBleScanning = true;
        } catch (SecurityException ignored) {
            isBleScanning = false;
            return;
        }

        // Buffer and flush once per second to avoid flooding JS bridge
        bleFlushRunnable = new Runnable() {
            @Override
            public void run() {
                if (!isBleScanning) return;

                List<JSObject> toFlush = new ArrayList<>();
                synchronized (bleBuffer) {
                    if (!bleBuffer.isEmpty()) {
                        toFlush.addAll(bleBuffer.values());
                        bleBuffer.clear();
                    }
                }

                if (!toFlush.isEmpty()) {
                    JSArray arr = new JSArray();
                    for (JSObject o : toFlush) {
                        arr.put(o);
                    }
                    JSObject payload = new JSObject();
                    payload.put("devices", arr);
                    notifyListeners("devices", payload);
                }

                mainHandler.postDelayed(this, 1000);
            }
        };
        mainHandler.postDelayed(bleFlushRunnable, 1000);
    }

    private synchronized void stopAllScanning() {
        if (isWifiScanning) {
            if (wifiScanRunnable != null) {
                mainHandler.removeCallbacks(wifiScanRunnable);
                wifiScanRunnable = null;
            }
            if (wifiReceiver != null) {
                try {
                    getContext().getApplicationContext().unregisterReceiver(wifiReceiver);
                } catch (Exception ignored) {
                }
                wifiReceiver = null;
            }
            isWifiScanning = false;
        }

        if (isBleScanning) {
            if (bleFlushRunnable != null) {
                mainHandler.removeCallbacks(bleFlushRunnable);
                bleFlushRunnable = null;
            }
            if (bleScanner != null && bleScanCallback != null) {
                try {
                    bleScanner.stopScan(bleScanCallback);
                } catch (SecurityException ignored) {
                }
                bleScanCallback = null;
            }
            synchronized (bleBuffer) {
                bleBuffer.clear();
            }
            isBleScanning = false;
        }
    }

    @Override
    protected void handleOnDestroy() {
        stopAllScanning();
        super.handleOnDestroy();
    }
}
