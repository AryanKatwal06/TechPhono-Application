import { Image, StyleSheet, View } from 'react-native';
interface Props {
  size?: number;
}
export default function AppLogo({ size = 120 }: Props) {
  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/logo.png')}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
});