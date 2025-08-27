import React, { useRef } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import WebMapbox from './WebMapbox';

export default function MapSelector() {
  const webViewRef = useRef<WebView>(null);

  return (
    <View style={{ height: '100%', width: '100%' }}>
      <WebMapbox webViewRef={webViewRef} />
    </View>
  );
}
