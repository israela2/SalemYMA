import {
    ActivityIndicator,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';

export default function ZonunReader() {

  const { url } = useLocalSearchParams();

  const pdfUrl =
    `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(
      String(url)
    )}`;

  return (
    <SafeAreaView style={styles.container}>

      <LinearGradient
        colors={[
          '#D32F2F',
          '#8E1B1B',
          '#111111'
        ]}
        style={styles.header}
      >

        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>
            ‹
          </Text>
        </Pressable>


        <Text style={styles.title}>
          Zonun PDF
        </Text>

      </LinearGradient>


      <WebView
        source={{
          uri: pdfUrl
        }}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>

            <ActivityIndicator
              size="large"
              color="#C62828"
            />

            <Text>
              PDF loading...
            </Text>

          </View>
        )}
      />

    </SafeAreaView>
  );
}


const styles = StyleSheet.create({

  container:{
    flex:1,
    backgroundColor:'#FFFFFF'
  },

  header:{
    height:85,
    flexDirection:'row',
    alignItems:'center',
    paddingHorizontal:18,
  },

  backButton:{
    width:42,
    height:42,
    borderRadius:21,
    backgroundColor:'#FFFFFF22',
    alignItems:'center',
    justifyContent:'center',
  },

  backText:{
    color:'#FFFFFF',
    fontSize:34,
  },

  title:{
    color:'#FFFFFF',
    fontSize:21,
    fontWeight:'900',
    marginLeft:15,
  },

  loading:{
    flex:1,
    alignItems:'center',
    justifyContent:'center',
  }

});