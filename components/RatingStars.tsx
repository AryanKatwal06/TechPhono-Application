import { colors, spacing } from '@/constants/theme';
import { Star } from 'lucide-react-native';
import React from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
interface RatingStarsProps {
    rating: number;
    size?: number;
    onRate?: (rating: number) => void;
    readonly?: boolean;
}
export const RatingStars: React.FC<RatingStarsProps> = ({
    rating,
    size = 24,
    onRate,
    readonly = false,
}) => {
    const handlePress = (value: number) => {
        if (readonly || !onRate) return;
        onRate(value);
    };
    return (
        <View style={styles.container}>
            {[1, 2, 3, 4, 5].map((star) => {
                const isActive = star <= rating;
                return (
                    <TouchableOpacity
                        key={star}
                        activeOpacity={0.7}
                        onPress={() => handlePress(star)}
                        disabled={readonly}
                        style={styles.starWrapper}
                        accessibilityRole="button"
                        accessibilityLabel={`Rate ${star} star`}
                    >
                        <Star
                            size={size}
                            fill={isActive ? colors.warning : 'transparent'}
                            color={isActive ? colors.warning : colors.textLight}
                            strokeWidth={2}
                        />
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};
const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    starWrapper: {
        marginHorizontal: spacing.xs,
        padding: 2,
    },
});