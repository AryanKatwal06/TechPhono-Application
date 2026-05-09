import { colors, spacing } from '@/constants/theme';
import { useResponsiveSpacing, useResponsiveTypography, useResponsiveComponentSizes } from '@/utils/responsive';
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
    pending: {
        label: 'Pending',
        icon: Clock,
        description: 'Waiting to be received'
    },
    Pending: {
        label: 'Pending',
        icon: Clock,
        description: 'Waiting to be received'
    },
    received: {
        label: 'Received',
        icon: Package,
        description: 'We received your device'
    },
    Received: {
        label: 'Received',
        icon: Package,
        description: 'We received your device'
    },
    diagnosing: {
        label: 'Diagnosing',
        icon: Clock,
        description: 'Checking the issue'
    },
    Diagnosing: {
        label: 'Diagnosing',
        icon: Clock,
        description: 'Checking the issue'
    },
    repairing: {
        label: 'Repairing',
        icon: Wrench,
        description: 'Fixing your device'
    },
    Repairing: {
        label: 'Repairing',
        icon: Wrench,
        description: 'Fixing your device'
    },
    repaired: {
        label: 'Repaired',
        icon: CheckCircle2,
        description: 'Ready for pickup'
    },
    Repaired: {
        label: 'Repaired',
        icon: CheckCircle2,
        description: 'Ready for pickup'
    },
    completed: {
        label: 'Completed',
        icon: CheckCircle2,
        description: 'Job completed successfully'
    },
    Completed: {
        label: 'Completed',
        icon: CheckCircle2,
        description: 'Job completed successfully'
    },
    cancelled: {
        label: 'Cancelled',
        icon: X,
        description: 'Request was cancelled'
    },
    Cancelled: {
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
    const spacing_val = useResponsiveSpacing();
    const typography_val = useResponsiveTypography();
    const componentSizes = useResponsiveComponentSizes();

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

    const iconSize = componentSizes.fabSize * 0.5;

    return (
        <View style={[styles.container, { paddingVertical: spacing_val.md }]}>
            {statusOrder.map((step, index) => {
                const config = statusConfig[step];
                const Icon = config.icon;
                const isActive = index <= currentIndex;
                const isCurrent = index === currentIndex;
                return (
                    <View key={step} style={[styles.stepContainer, { marginBottom: spacing_val.md }]}>
                        <View style={styles.stepRow}>
                            <View style={[styles.iconLine, { marginRight: spacing_val.md }]}>
                                <View
                                    style={[
                                        styles.iconWrapper,
                                        {
                                            width: iconSize,
                                            height: iconSize,
                                            borderRadius: iconSize / 2,
                                        },
                                        isActive && styles.iconWrapperActive,
                                        isCurrent && styles.iconWrapperCurrent
                                    ]}
                                >
                                    <Icon
                                        size={componentSizes.iconMd}
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
                            <View style={[styles.content, { paddingTop: spacing_val.xs }]}>
                                <Text
                                    style={[
                                        styles.label,
                                        { fontSize: typography_val.body, marginBottom: spacing_val.xs },
                                        isActive && styles.labelActive,
                                        isCurrent && styles.labelCurrent
                                    ]}
                                >
                                    {config.label}
                                </Text>
                                <Text style={[styles.description, { fontSize: typography_val.bodySmall, marginBottom: spacing_val.xs }]}>
                                    {config.description}
                                </Text>
                                {timestamps[step] && (
                                    <Text style={[styles.timestamp, { fontSize: typography_val.caption }]}>
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
        paddingVertical: 0,
    },
    stepContainer: {
        marginBottom: 0,
    },
    stepRow: {
        flexDirection: 'row'
    },
    iconLine: {
        alignItems: 'center',
        marginRight: 0,
    },
    iconWrapper: {
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
        paddingTop: 0,
    },
    label: {
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 0,
    },
    labelActive: {
        color: colors.text
    },
    labelCurrent: {
        color: colors.accent,
        fontWeight: '700'
    },
    description: {
        color: colors.textSecondary,
        marginBottom: 0,
    },
    timestamp: {
        color: colors.textLight
    }
});