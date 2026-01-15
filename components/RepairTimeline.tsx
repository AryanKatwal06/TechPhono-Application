import { colors, spacing } from '@/constants/theme';
import type { RepairStatus } from '@/types/database';
import {
    CheckCircle2,
    Clock,
    Package,
    Wrench,
    X
} from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
interface RepairTimelineProps {
    status: RepairStatus;
    timestamps?: Partial<Record<RepairStatus, string>>;
}
type StatusConfig = {
    label: string;
    icon: React.FC<{ size: number; color: string; strokeWidth?: number }>;
    description: string;
};
const statusConfig: Record<RepairStatus, StatusConfig> = {
    received: {
        label: 'Received',
        icon: Package,
        description: 'We received your device'
    },
    diagnosing: {
        label: 'Diagnosing',
        icon: Clock,
        description: 'Checking the issue'
    },
    repairing: {
        label: 'Repairing',
        icon: Wrench,
        description: 'Fixing your device'
    },
    repaired: {
        label: 'Repaired',
        icon: CheckCircle2,
        description: 'Ready for pickup'
    },
    completed: {
        label: 'Completed',
        icon: CheckCircle2,
        description: 'Job completed successfully'
    },
    cancelled: {
        label: 'Cancelled',
        icon: X,
        description: 'Request was cancelled'
    }
};
const statusOrder: RepairStatus[] = [
    'received',
    'diagnosing',
    'repairing',
    'repaired',
    'completed'
];
export const RepairTimeline: React.FC<RepairTimelineProps> = ({
    status,
    timestamps = {}
}) => {
    const currentIndex = Math.max(
        0,
        statusOrder.indexOf(status)
    );
    const formatTime = (timestamp?: string) => {
        if (!timestamp) return null;
        const date = new Date(timestamp);
        return date.toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    return (
        <View style={styles.container}>
            {statusOrder.map((step, index) => {
                const config = statusConfig[step];
                const Icon = config.icon;
                const isActive = index <= currentIndex;
                const isCurrent = index === currentIndex;
                return (
                    <View key={step} style={styles.stepContainer}>
                        <View style={styles.stepRow}>
                            <View style={styles.iconLine}>
                                <View
                                    style={[
                                        styles.iconWrapper,
                                        isActive && styles.iconWrapperActive,
                                        isCurrent && styles.iconWrapperCurrent
                                    ]}
                                >
                                    <Icon
                                        size={20}
                                        color={isActive ? colors.card : colors.textLight}
                                        strokeWidth={2.5}
                                    />
                                </View>
                                {index < statusOrder.length - 1 && (
                                    <View
                                        style={[
                                            styles.line,
                                            isActive && index < currentIndex && styles.lineActive
                                        ]}
                                    />
                                )}
                            </View>
                            <View style={styles.content}>
                                <Text
                                    style={[
                                        styles.label,
                                        isActive && styles.labelActive,
                                        isCurrent && styles.labelCurrent
                                    ]}
                                >
                                    {config.label}
                                </Text>
                                <Text style={styles.description}>
                                    {config.description}
                                </Text>
                                {timestamps[step] && (
                                    <Text style={styles.timestamp}>
                                        {formatTime(timestamps[step])}
                                    </Text>
                                )}
                            </View>
                        </View>
                    </View>
                );
            })}
        </View>
    );
};
const styles = StyleSheet.create({
    container: {
        paddingVertical: spacing.md
    },
    stepContainer: {
        marginBottom: spacing.md
    },
    stepRow: {
        flexDirection: 'row'
    },
    iconLine: {
        alignItems: 'center',
        marginRight: spacing.md
    },
    iconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.background,
        borderWidth: 2,
        borderColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center'
    },
    iconWrapperActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary
    },
    iconWrapperCurrent: {
        backgroundColor: colors.accent,
        borderColor: colors.accent
    },
    line: {
        width: 2,
        flex: 1,
        minHeight: 40,
        backgroundColor: colors.border,
        marginTop: spacing.xs
    },
    lineActive: {
        backgroundColor: colors.primary
    },
    content: {
        flex: 1,
        paddingTop: spacing.xs
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 2
    },
    labelActive: {
        color: colors.text
    },
    labelCurrent: {
        color: colors.accent,
        fontWeight: '700'
    },
    description: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 4
    },
    timestamp: {
        fontSize: 12,
        color: colors.textLight
    }
});