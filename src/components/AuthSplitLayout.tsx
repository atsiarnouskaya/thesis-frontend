import React from 'react';
import {
  Image,
  ImageSourcePropType,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { colors } from '../theme/colors';
import { MAX_WIDTH } from '../theme/layout';
import { useI18n } from '../i18n/I18nContext';
import { LanguageToggle } from './LanguageToggle';
import { ScreenShell } from './ScreenShell';

const stockImage = require('../../assets/auth/stock-control.png');
const listImage = require('../../assets/auth/shopping-list.png');

const authCardShadow: ViewStyle = Platform.select({
  web: {
    boxShadow: '0 18px 50px rgba(8, 28, 21, 0.06), 0 2px 8px rgba(8, 28, 21, 0.04)',
  } as ViewStyle,
  default: {
    shadowColor: '#081C15',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.05,
    shadowRadius: 28,
    elevation: 2,
  },
}) as ViewStyle;

type Props = {
  children: React.ReactNode;
};

type FeatureCardProps = {
  image: ImageSourcePropType;
  title: string;
  text: string;
};

function FeatureCard({ image, title, text }: FeatureCardProps) {
  return (
    <View style={styles.featureCard}>
      <Image source={image} style={styles.featureImage} resizeMode="contain" accessible={false} />
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

export function AuthSplitLayout({ children }: Props) {
  const { t } = useI18n();
  const { isAuthSplit, width } = useResponsiveLayout();
  const insets = useSafeAreaInsets();
  const stackFeatures = width < 1180;

  const language = (
      <View
      style={[styles.langCorner, { top: Math.max(insets.top, 20), right: Math.max(insets.right, 28) }]}
    >
      <LanguageToggle compact floating />
    </View>
  );

  if (!isAuthSplit) {
    return (
      <View style={styles.flex}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScreenShell variant="auth" scroll={Platform.OS === 'web'}>
            {children}
          </ScreenShell>
        </KeyboardAvoidingView>
        {language}
      </View>
    );
  }

  return (
    <View style={styles.splitRoot}>
      {language}
      <ScrollView
        style={styles.hero}
        contentContainerStyle={styles.heroContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{t('auth.heroBadge')}</Text>
        </View>
        <Text style={styles.heroTitle}>{t('auth.heroTitle')}</Text>
        <Text style={styles.heroText}>{t('auth.heroText')}</Text>
        <View style={[styles.featureRow, stackFeatures && styles.featureRowStacked]}>
          <FeatureCard
            image={stockImage}
            title={t('auth.featureStockTitle')}
            text={t('auth.featureStockText')}
          />
          <FeatureCard
            image={listImage}
            title={t('auth.featureListsTitle')}
            text={t('auth.featureListsText')}
          />
        </View>
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.formColumn}
        keyboardShouldPersistTaps="handled"
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.formCard, authCardShadow]}>{children}</View>
        </KeyboardAvoidingView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  langCorner: {
    position: 'absolute',
    zIndex: 20,
  },
  splitRoot: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
    minHeight: '100%' as unknown as number,
  },
  hero: {
    flex: 1,
    backgroundColor: colors.primary,
    maxWidth: '46%',
  },
  heroContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 48,
    paddingVertical: 56,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginBottom: 22,
  },
  badgeText: {
    color: '#E8F8EF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 46,
    letterSpacing: -0.6,
    maxWidth: 460,
    marginBottom: 16,
  },
  heroText: {
    fontSize: 16,
    lineHeight: 26,
    color: 'rgba(255,255,255,0.78)',
    maxWidth: 460,
    marginBottom: 32,
  },
  featureRow: {
    flexDirection: 'row',
    gap: 14,
    maxWidth: 520,
  },
  featureRowStacked: {
    flexDirection: 'column',
  },
  featureCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
  },
  featureImage: {
    width: '100%',
    height: 112,
    marginBottom: 12,
  },
  featureTitle: {
    color: '#D8F3DC',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  featureText: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    lineHeight: 19,
  },
  formColumn: {
    flexGrow: 1,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
    paddingVertical: 72,
  },
  formCard: {
    width: MAX_WIDTH.authCard,
    maxWidth: '100%',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(216, 226, 220, 0.9)',
  },
});
