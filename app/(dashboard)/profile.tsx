import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Animated,
  Pressable,
  StatusBar,
  Switch,
  Image,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocationStore } from '@/store/location.store';
import { getSites } from '@/services/sites.service';
import { persistProfileImage } from '@/services/profile.service';
import { Button } from '@/components/ui/Button';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import type { LocaleCode } from '@/contexts/LanguageContext';

const TAB_BAR_HEIGHT = 60;

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profileImageUri, setProfileImageUri, logout } = useAuth();
  const { sites, setSites } = useLocationStore();
  const [loading, setLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [showProfilePhotoModal, setShowProfilePhotoModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const { t, locale, setLocale, localeName } = useLanguage();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 15,
        stiffness: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      setLoading(true);
      const { sites: siteList } = await getSites();
      setSites(siteList);
    } catch (error) {
      console.error('Failed to load sites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('profile.logoutTitle'),
      t('profile.logoutMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.logout'),
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleLanguageSelect = (code: LocaleCode) => {
    setLocale(code);
    setShowLanguageModal(false);
  };

  const getInitials = () => {
    const name = user?.name || 'User';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleChangeProfileImage = () => {
    setShowProfilePhotoModal(true);
  };

  const closeProfilePhotoModal = () => {
    setShowProfilePhotoModal(false);
  };

  const handleOptionSelect = (action: () => void) => {
    closeProfilePhotoModal();
    action();
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('profile.permissionRequired'), t('profile.allowPhotos'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      try {
        const persistedUri = await persistProfileImage(result.assets[0].uri);
        await setProfileImageUri(persistedUri);
      } catch (err) {
        console.error('Failed to save profile image:', err);
        Alert.alert(t('common.error'), t('profile.failedToSavePhoto'));
      }
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('profile.permissionRequired'), t('profile.allowCamera'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      try {
        const persistedUri = await persistProfileImage(result.assets[0].uri);
        await setProfileImageUri(persistedUri);
      } catch (err) {
        console.error('Failed to save profile image:', err);
        Alert.alert(t('common.error'), t('profile.failedToSavePhoto'));
      }
    }
  };

  const SettingsRow = ({
    icon,
    label,
    value,
    showArrow = false,
    showToggle = false,
    toggleValue,
    onToggle,
    onPress,
    isLast = false,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value?: string;
    showArrow?: boolean;
    showToggle?: boolean;
    toggleValue?: boolean;
    onToggle?: (value: boolean) => void;
    onPress?: () => void;
    isLast?: boolean;
  }) => (
    <Pressable
      onPress={onPress}
      disabled={!onPress && !showToggle}
      style={({ pressed }) => [
        styles.settingsRow,
        isLast && styles.settingsRowLast,
        pressed && onPress && styles.settingsRowPressed,
      ]}
    >
      <View style={styles.settingsIconContainer}>
        <Ionicons name={icon} size={20} color={Colors.neutral[700]} />
      </View>
      <Text style={styles.settingsLabel}>{label}</Text>
      {showToggle && (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: Colors.neutral[300], true: '#2D6A4F' }}
          thumbColor={toggleValue ? Colors.neutral[0] : Colors.neutral[100]}
          ios_backgroundColor={Colors.neutral[300]}
        />
      )}
      {showArrow && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={Colors.neutral[400]}
        />
      )}
      {value && <Text style={styles.settingsValue}>{value}</Text>}
    </Pressable>
  );

  const InfoRow = ({
    icon,
    label,
    value,
    isLast = false,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
    isLast?: boolean;
  }) => (
    <View style={[styles.infoRow, isLast && styles.settingsRowLast]}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={20} color="#2D6A4F" />
      </View>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  );

  const employeeIdDisplay = user?.employeeId
    ? (user.employeeId.startsWith('EMP') ? user.employeeId : `EMP${user.employeeId}`)
    : '—';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1B4332" />
      
      {/* Dark green header - centered avatar, name, Employee ID badge */}
      <LinearGradient
        colors={['#163A2B', '#1B4332', '#2D6A4F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.header}
      >
        <Animated.View
          style={[
            styles.headerContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Pressable style={styles.avatarOuter} onPress={handleChangeProfileImage}>
            <View style={styles.avatar}>
              {profileImageUri ? (
                <Image source={{ uri: profileImageUri }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{getInitials()}</Text>
              )}
            </View>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark" size={12} color={Colors.neutral[0]} />
            </View>
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={14} color={Colors.neutral[0]} />
            </View>
          </Pressable>
          <Text style={styles.headerName}>{user?.name || t('common.user')}</Text>
          <View style={styles.employeeIdBadge}>
            <Ionicons name="phone-portrait-outline" size={14} color={Colors.neutral[0]} />
            <Text style={styles.employeeIdText}>{employeeIdDisplay}</Text>
          </View>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: TAB_BAR_HEIGHT + (insets.bottom || 0) + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Employee Information */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={20} color={Colors.neutral[700]} />
            <Text style={styles.sectionTitle}>{t('profile.employeeInformation')}</Text>
          </View>
          <View style={styles.settingsCard}>
            <SettingsRow
              icon="person-circle-outline"
              label={t('profile.profilePhoto')}
              value={profileImageUri ? t('common.change') : t('common.addPhoto')}
              showArrow
              onPress={handleChangeProfileImage}
            />
            <InfoRow icon="mail-outline" label={t('profile.email')} value={user?.email ?? '—'} />
            <InfoRow icon="business-outline" label={t('profile.department')} value={user?.department ?? t('common.nA')} />
            <InfoRow icon="briefcase-outline" label={t('profile.position')} value={user?.position ?? t('common.nA')} isLast />
          </View>
        </Animated.View>

        {/* Assigned Sites */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location-outline" size={20} color={Colors.neutral[700]} />
              <Text style={styles.sectionTitle}>{t('profile.assignedSites')}</Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{sites.length}</Text>
            </View>
          </View>
          <View style={styles.settingsCard}>
            {sites.length === 0 ? (
              <View style={styles.emptySites}>
                <Text style={styles.emptySitesText}>{t('profile.noSitesAssigned')}</Text>
              </View>
            ) : (
              sites.map((site, index) => (
                <Pressable
                  key={site.id}
                  style={[
                    styles.siteRow,
                    index === sites.length - 1 && styles.siteRowLast,
                  ]}
                  onPress={() => {}}
                >
                  <Ionicons name="business-outline" size={20} color="#2D6A4F" />
                  <Text style={styles.siteName}>{site.name}</Text>
                  <Ionicons name="send" size={18} color={Colors.neutral[400]} />
                </Pressable>
              ))
            )}
          </View>
        </Animated.View>

        {/* Other Information Section */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <Text style={styles.sectionTitle}>{t('profile.otherInformation')}</Text>
          <View style={styles.settingsCard}>
            <SettingsRow
              icon="notifications"
              label={t('profile.notification')}
              showToggle
              toggleValue={notificationsEnabled}
              onToggle={setNotificationsEnabled}
            />
            <SettingsRow
              icon="language"
              label={t('profile.language')}
              showArrow
              onPress={() => setShowLanguageModal(true)}
            />
            <SettingsRow
              icon="moon"
              label={t('profile.darkMode')}
              showToggle
              toggleValue={darkModeEnabled}
              onToggle={setDarkModeEnabled}
              isLast
            />
          </View>
        </Animated.View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <Button
            title={t('profile.logout')}
            onPress={handleLogout}
            variant="danger"
            icon="log-out-outline"
            size="lg"
          />
        </View>

        {/* App Version */}
        <Text style={styles.versionText}>{t('profile.version')}</Text>
      </ScrollView>

      {/* Profile Photo Options Modal */}
      <Modal
        visible={showProfilePhotoModal}
        transparent
        animationType="fade"
        onRequestClose={closeProfilePhotoModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeProfilePhotoModal}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{t('profile.profilePhotoTitle')}</Text>
            <Text style={styles.modalSubtitle}>{t('profile.selectOption')}</Text>

            <Pressable
              style={({ pressed }) => [styles.optionButton, pressed && styles.optionButtonPressed]}
              onPress={() => handleOptionSelect(pickFromGallery)}
            >
              <Ionicons name="images-outline" size={22} color="#1B4332" />
              <Text style={styles.optionButtonText}>{t('profile.chooseFromGallery')}</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.neutral[400]} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.optionButton, pressed && styles.optionButtonPressed]}
              onPress={() => handleOptionSelect(takePhoto)}
            >
              <Ionicons name="camera-outline" size={22} color="#1B4332" />
              <Text style={styles.optionButtonText}>{t('profile.takePhoto')}</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.neutral[400]} />
            </Pressable>

            {profileImageUri && (
              <Pressable
                style={({ pressed }) => [styles.optionButton, styles.optionButtonDanger, pressed && styles.optionButtonPressed]}
                onPress={() => handleOptionSelect(() => setProfileImageUri(null))}
              >
                <Ionicons name="trash-outline" size={22} color={Colors.error[600]} />
                <Text style={[styles.optionButtonText, styles.optionButtonTextDanger]}>{t('profile.removePhoto')}</Text>
                <Ionicons name="chevron-forward" size={20} color={Colors.neutral[400]} />
              </Pressable>
            )}

            <Pressable
              style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
              onPress={closeProfilePhotoModal}
            >
              <Text style={styles.closeButtonText}>{t('common.close')}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Language Picker Modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowLanguageModal(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{t('profile.selectLanguage')}</Text>
            <Text style={styles.modalSubtitle}>{t('profile.selectOption')}</Text>

            {(['en', 'hi', 'ta'] as LocaleCode[]).map((code) => (
              <Pressable
                key={code}
                style={({ pressed }) => [styles.optionButton, pressed && styles.optionButtonPressed]}
                onPress={() => handleLanguageSelect(code)}
              >
                <Ionicons name="language" size={22} color="#1B4332" />
                <Text style={styles.optionButtonText}>{localeName(code)}</Text>
                {locale === code ? (
                  <Ionicons name="checkmark-circle" size={22} color="#2D6A4F" />
                ) : (
                  <Ionicons name="chevron-forward" size={20} color={Colors.neutral[400]} />
                )}
              </Pressable>
            ))}

            <Pressable
              style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
              onPress={() => setShowLanguageModal(false)}
            >
              <Text style={styles.closeButtonText}>{t('common.close')}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 50,
    paddingBottom: Spacing[8],
    paddingHorizontal: Spacing[4],
    borderBottomLeftRadius: BorderRadius['2xl'],
    borderBottomRightRadius: BorderRadius['2xl'],
    overflow: 'hidden',
  },
  headerContent: {
    alignItems: 'center',
  },
  avatarOuter: {
    position: 'relative',
    marginBottom: Spacing[3],
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.neutral[0],
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  avatarText: {
    fontSize: Typography.size['3xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.neutral[700],
    letterSpacing: 1,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 44,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1B4332',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#34D399',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1B4332',
  },
  headerName: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.neutral[0],
    marginBottom: Spacing[2],
  },
  employeeIdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing[4],
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  employeeIdText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.neutral[0],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[2] + 4,
    marginTop: Spacing[1],
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[2] + 4,
    marginTop: Spacing[1],
  },
  countBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2D6A4F',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  countBadgeText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.neutral[0],
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing[3] + 4,
    paddingHorizontal: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  infoIconWrap: {
    width: 28,
    marginRight: Spacing[3],
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: Typography.size.sm,
    color: Colors.neutral[600],
    width: 100,
  },
  infoValue: {
    flex: 1,
    fontSize: Typography.size.base,
    color: Colors.neutral[900],
    fontWeight: Typography.weight.medium,
    textAlign: 'right',
  },
  siteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing[3] + 4,
    paddingHorizontal: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
    gap: Spacing[3],
  },
  siteRowLast: {
    borderBottomWidth: 0,
  },
  siteName: {
    flex: 1,
    fontSize: Typography.size.base,
    color: Colors.neutral[900],
    fontWeight: Typography.weight.medium,
  },
  emptySites: {
    paddingVertical: Spacing[6],
    paddingHorizontal: Spacing[4],
    alignItems: 'center',
  },
  emptySitesText: {
    fontSize: Typography.size.sm,
    color: Colors.neutral[500],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[6],
  },
  sectionTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.neutral[900],
    marginBottom: Spacing[2] + 4,
    marginTop: Spacing[1],
  },
  settingsCard: {
    backgroundColor: Colors.neutral[0],
    borderRadius: BorderRadius['2xl'],
    ...Shadows.sm,
    marginBottom: Spacing[3],
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing[3] + 4,
    paddingHorizontal: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  settingsRowLast: {
    borderBottomWidth: 0,
  },
  settingsRowPressed: {
    backgroundColor: Colors.neutral[50],
  },
  settingsIconContainer: {
    width: 22,
    marginRight: Spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsLabel: {
    flex: 1,
    fontSize: Typography.size.base,
    color: Colors.neutral[900],
    fontWeight: Typography.weight.medium,
  },
  settingsValue: {
    fontSize: Typography.size.sm,
    color: Colors.neutral[500],
    marginRight: Spacing[2],
  },
  logoutSection: {
    marginTop: Spacing[2],
    marginBottom: Spacing[3],
  },
  versionText: {
    textAlign: 'center',
    fontSize: Typography.size.xs,
    color: Colors.neutral[400],
    marginBottom: Spacing[6],
    fontWeight: Typography.weight.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[4],
  },
  modalContent: {
    backgroundColor: Colors.neutral[0],
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[5],
    width: '100%',
    maxWidth: 340,
    ...Shadows.lg,
  },
  modalTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.neutral[900],
    marginBottom: Spacing[1],
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: Typography.size.sm,
    color: Colors.neutral[500],
    marginBottom: Spacing[4],
    textAlign: 'center',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing[3] + 4,
    paddingHorizontal: Spacing[4],
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing[2],
    gap: Spacing[3],
  },
  optionButtonPressed: {
    backgroundColor: Colors.neutral[100],
  },
  optionButtonDanger: {
    backgroundColor: Colors.error[50],
  },
  optionButtonText: {
    flex: 1,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.medium,
    color: Colors.neutral[900],
  },
  optionButtonTextDanger: {
    color: Colors.error[600],
  },
  closeButton: {
    marginTop: Spacing[2],
    paddingVertical: Spacing[3],
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.neutral[200],
  },
  closeButtonPressed: {
    backgroundColor: Colors.neutral[300],
  },
  closeButtonText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: Colors.neutral[700],
  },
});
