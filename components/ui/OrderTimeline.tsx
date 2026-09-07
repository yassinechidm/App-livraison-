import Colors from '@/constants/Colors';
import { ORDER_STATUS_CONFIG, OrderStatus } from '@/types/order.types';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface OrderTimelineProps {
  currentStatus: OrderStatus;
}

const STEPS: { status: OrderStatus; label: string; icon: string }[] = [
  { status: 'PENDING', label: 'Reçue', icon: '📝' },
  { status: 'CONFIRMED', label: 'Confirmée', icon: '✓' },
  { status: 'PREPARING', label: 'Préparation', icon: '🍳' },
  { status: 'READY', label: 'Prête', icon: '🛍️' },
  { status: 'OUT_FOR_DELIVERY', label: 'Livraison', icon: '🛵' },
  { status: 'DELIVERED', label: 'Livrée', icon: '✅' },
];

export default function OrderTimeline({ currentStatus }: OrderTimelineProps) {
  if (currentStatus === 'CANCELLED') {
    return (
      <View style={styles.cancelledCard}>
        <Text style={styles.cancelledIcon}>✕</Text>
        <Text style={styles.cancelledTitle}>Commande Annulée</Text>
        <Text style={styles.cancelledSubtitle}>Cette commande a été annulée.</Text>
      </View>
    );
  }

  const currentStepIndex = ORDER_STATUS_CONFIG[currentStatus].stepIndex;

  return (
    <View style={styles.container}>
      <View style={styles.timelineHeader}>
        <View
          style={[
            styles.currentBadge,
            { backgroundColor: ORDER_STATUS_CONFIG[currentStatus].bgColor },
          ]}
        >
          <Text style={styles.currentIcon}>{ORDER_STATUS_CONFIG[currentStatus].icon}</Text>
          <Text
            style={[
              styles.currentText,
              { color: ORDER_STATUS_CONFIG[currentStatus].color },
            ]}
          >
            {ORDER_STATUS_CONFIG[currentStatus].label}
          </Text>
        </View>
        <Text style={styles.description}>
          {ORDER_STATUS_CONFIG[currentStatus].description}
        </Text>
      </View>

      {/* Visual step progress line */}
      <View style={styles.stepsContainer}>
        {STEPS.map((step, index) => {
          const isPassed = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;

          return (
            <View key={step.status} style={styles.stepWrapper}>
              <View style={styles.nodeRow}>
                {index > 0 && (
                  <View
                    style={[
                      styles.line,
                      isPassed && styles.linePassed,
                    ]}
                  />
                )}
                <View
                  style={[
                    styles.node,
                    isPassed && styles.nodePassed,
                    isCurrent && styles.nodeCurrent,
                  ]}
                >
                  <Text style={styles.nodeIcon}>{step.icon}</Text>
                </View>
                {index < STEPS.length - 1 && (
                  <View
                    style={[
                      styles.line,
                      index < currentStepIndex && styles.linePassed,
                    ]}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  isPassed && styles.stepLabelPassed,
                  isCurrent && styles.stepLabelCurrent,
                ]}
                numberOfLines={1}
              >
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timelineHeader: {
    marginBottom: 16,
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
    marginBottom: 6,
  },
  currentIcon: {
    fontSize: 14,
  },
  currentText: {
    fontSize: 12,
    fontWeight: '800',
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  stepWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  nodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
    marginBottom: 6,
  },
  line: {
    flex: 1,
    height: 3,
    backgroundColor: '#E2E8F0',
  },
  linePassed: {
    backgroundColor: Colors.primary,
  },
  node: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  nodePassed: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  nodeCurrent: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
    transform: [{ scale: 1.15 }],
  },
  nodeIcon: {
    fontSize: 10,
  },
  stepLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.textMuted,
    textAlign: 'center',
  },
  stepLabelPassed: {
    color: Colors.textPrimary,
  },
  stepLabelCurrent: {
    color: Colors.primary,
    fontWeight: '800',
  },
  cancelledCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  cancelledIcon: {
    fontSize: 28,
    color: Colors.error,
    fontWeight: '800',
    marginBottom: 4,
  },
  cancelledTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.error,
  },
  cancelledSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
