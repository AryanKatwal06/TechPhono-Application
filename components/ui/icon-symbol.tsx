import { Code2, Home, Send, ChevronRight } from 'lucide-react-native';
import { type StyleProp, type TextStyle } from 'react-native';

type IconSymbolName = 'house.fill' | 'paperplane.fill' | 'chevron.left.forwardslash.chevron.right' | 'chevron.right';

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string;
  style?: StyleProp<TextStyle>;
}) {
  const Icon = name === 'house.fill'
    ? Home
    : name === 'paperplane.fill'
      ? Send
      : name === 'chevron.left.forwardslash.chevron.right'
        ? Code2
        : ChevronRight;

  return <Icon color={color} size={size} style={style as any} />;
}
