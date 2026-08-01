import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Cropper, { Area } from 'react-easy-crop';
import { colors } from '../theme/colors';
import { createCroppedImageFromArea } from '../utils/createCroppedImage.web';
import { registerWebCropHost } from '../utils/webCropBridge';

type CropSession = {
  imageUrl: string;
  resolve: (value: { uri: string; fileName: string; mimeType: string } | null) => void;
};

export function AvatarCropHost() {
  const [session, setSession] = useState<CropSession | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finish = useCallback((result: { uri: string; fileName: string; mimeType: string } | null) => {
    setSession((current) => {
      current?.resolve(result);
      return null;
    });
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setError(null);
    setSaving(false);
  }, []);

  useEffect(() => {
    return registerWebCropHost((request) => {
      setSession(request);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      setError(null);
    });
  }, []);

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const onCancel = () => {
    finish(null);
  };

  const onConfirm = async () => {
    if (!session || !croppedAreaPixels) {
      setError('Wybierz obszar kadrowania');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const cropped = await createCroppedImageFromArea(session.imageUrl, croppedAreaPixels);
      finish({
        uri: cropped.uri,
        fileName: `profile-${Date.now()}.jpg`,
        mimeType: cropped.mimeType,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się przyciąć zdjęcia');
      setSaving(false);
    }
  };

  return (
    <Modal visible={Boolean(session)} animationType="fade" transparent onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <Text style={styles.title}>Przytnij zdjęcie profilowe</Text>
          <Text style={styles.subtitle}>Przesuń i powiększ — na avatarze widać tylko kwadrat w środku.</Text>

          <View style={styles.cropWrapper}>
            {session ? (
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <Cropper
                  image={session.imageUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="rect"
                  showGrid
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
            ) : null}
          </View>

          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>Powiększenie</Text>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              style={{ width: '100%' }}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Pressable style={styles.secondaryButton} onPress={onCancel} disabled={saving}>
              <Text style={styles.secondaryText}>Anuluj</Text>
            </Pressable>
            <Pressable style={styles.primaryButton} onPress={onConfirm} disabled={saving}>
              <Text style={styles.primaryText}>{saving ? 'Zapisywanie…' : 'Użyj tego kadru'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 16,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 14,
    color: colors.textMuted,
    lineHeight: 18,
  },
  cropWrapper: {
    height: 320,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  sliderRow: {
    marginTop: 14,
    marginBottom: 8,
  },
  sliderLabel: {
    marginBottom: 6,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  error: {
    color: colors.error,
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryText: {
    color: colors.text,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryText: {
    color: '#fff',
    fontWeight: '700',
  },
});
