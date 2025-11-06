import { Text, TextProps } from 'react-native';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({ style, type = 'default', ...rest }: ThemedTextProps) {
  return (
    <Text
      style={[
        type === 'default' ? { fontSize: 16 } : undefined,
        type === 'title' ? { fontSize: 28, fontWeight: 'bold' } : undefined,
        type === 'defaultSemiBold' ? { fontSize: 16, fontWeight: '600' } : undefined,
        type === 'subtitle' ? { fontSize: 20, fontWeight: 'bold' } : undefined,
        type === 'link' ? { fontSize: 16, color: '#2196F3' } : undefined,
        style,
      ]}
      {...rest}
    />
  );
}