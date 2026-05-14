import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { borderRadius, colors, shadows, spacing } from '@/constants/theme';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react-native';

export type AlertType = 'error' | 'success' | 'info' | 'warning';

export interface AlertDialogButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'destructive' | 'primary';
}

interface AlertDialogProps {
  visible: boolean;
  title: string;
  message: string;
  type?: AlertType;
  buttons?: AlertDialogButton[];
  onDismiss?: () => void;
}

const getTypeConfig = (type: AlertType) => {
  switch (type) {
    case 'error':
      return { color: colors.danger, icon: AlertCircle };
    case 'success':
      return { color: colors.success, icon: CheckCircle };
    case 'warning':
      return { color: colors.warning, icon: AlertTriangle };
    case 'info':
    default:
      return { color: colors.info, icon: Info };
  }
};

export default function AlertDialog({
  visible,
  title,
  message,
  type = 'info',
  buttons,
  onDismiss,
}: AlertDialogProps) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { width } = Dimensions.get('window');
  const isSmallScreen = width < 400;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleAnim, fadeAnim]);

  const typeConfig = getTypeConfig(type);
  const Icon = typeConfig.icon;

  const defaultButtons: AlertDialogButton[] =
    buttons && buttons.length > 0
      ? buttons
      : [
          {
            text: 'OK',
            onPress: onDismiss || (() => {}),
            style: 'primary',
          },
        ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onDismiss}
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View
            style={[
              styles.content,
              {
                maxWidth: isSmallScreen ? '90%' : 320,
              },
            ]}
          >
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: typeConfig.color + '15' }]}>
              <Icon color={typeConfig.color} size={32} strokeWidth={1.5} />
            </View>

            {/* Title */}
            <Text style={styles.title}>{title}</Text>

            {/* Message */}
            <Text style={styles.message}>{message}</Text>

            {/* Buttons */}
            <View style={[
              styles.buttonContainer,
              defaultButtons.length > 1 && styles.buttonContainerMultiple,
            ]}>
              {defaultButtons.map((button, index) => {
                // Allow style props to be a StyleProp<ViewStyle> / StyleProp<TextStyle>
                // to satisfy TypeScript when using array style merging below.
                let buttonStyle: any = styles.button;
                let textStyle: any = styles.buttonText;

                if (button.style === 'destructive') {
                  buttonStyle = [styles.button, styles.buttonDestructive];
                  textStyle = [styles.buttonText, styles.buttonTextDestructive];
                } else if (button.style === 'primary') {
                  buttonStyle = [styles.button, styles.buttonPrimary];
                  textStyle = [styles.buttonText, styles.buttonTextPrimary];
                }

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      buttonStyle,
                      defaultButtons.length > 1 && index === 0 && styles.buttonFirst,
                      defaultButtons.length > 1 && index === defaultButtons.length - 1 && styles.buttonLast,
                    ]}
                    onPress={() => {
                      button.onPress?.();
                      onDismiss?.();
                    }}
                    activeOpacity={0.75}
                  >
                    <Text style={textStyle}>{button.text}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.lg,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  buttonContainer: {
    width: '100%',
    gap: spacing.sm,
  },
  buttonContainerMultiple: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonFirst: {
    marginRight: spacing.sm / 2,
  },
  buttonLast: {
    marginLeft: spacing.sm / 2,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  buttonDestructive: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  buttonTextPrimary: {
    color: colors.textInverse,
  },
  buttonTextDestructive: {
    color: colors.textInverse,
  },
});
