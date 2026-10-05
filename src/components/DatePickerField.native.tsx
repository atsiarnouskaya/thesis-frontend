import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  dateToLocalDateString,
  formatLocalDate,
  parseLocalDateToDate,
  todayLocalDateString,
} from '../ingredient/ingredientFormat';
import { colors } from '../theme/colors';
import { formStyles, webPointer } from '../theme/forms';

type Props = {
  value: string;
  onChange: (value: string) => void;
  editable?: boolean;
  placeholder?: string;
};

export function DatePickerField({
  value,
  onChange,
  editable = true,
  placeholder = 'Wybierz datę',
}: Props) {
  const [open, setOpen] = useState(false);
  const [draftDate, setDraftDate] = useState(() =>
    value ? parseLocalDateToDate(value) : parseLocalDateToDate(todayLocalDateString()),
  );

  const displayValue = useMemo(() => {
    if (!value) {
      return placeholder;
    }
    return formatLocalDate(value);
  }, [placeholder, value]);

  const openPicker = () => {
    if (!editable) {
      return;
    }
    setDraftDate(value ? parseLocalDateToDate(value) : parseLocalDateToDate(todayLocalDateString()));
    setOpen(true);
  };

  const closePicker = () => {
    setOpen(false);
  };

  const confirmPicker = () => {
    onChange(dateToLocalDateString(draftDate));
    closePicker();
  };

  const onAndroidChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setOpen(false);
    if (event.type === 'dismissed' || !selectedDate) {
      return;
    }
    onChange(dateToLocalDateString(selectedDate));
  };

  return (
    <>
      <Pressable
        onPress={openPicker}
        disabled={!editable}
        style={[
          styles.trigger,
          !value && styles.triggerPlaceholder,
          !editable && styles.triggerDisabled,
          webPointer,
        ]}
      >
        <Text style={[styles.triggerText, !value && styles.triggerTextPlaceholder]}>
          {displayValue}
        </Text>
        <Text style={styles.triggerIcon}>📅</Text>
      </Pressable>

      {open && Platform.OS === 'android' ? (
        <DateTimePicker
          value={draftDate}
          mode="date"
          display="calendar"
          onChange={onAndroidChange}
        />
      ) : null}

      {open && Platform.OS === 'ios' ? (
        <Modal transparent animationType="slide" onRequestClose={closePicker}>
          <View style={styles.modalBackdrop}>
            <Pressable style={styles.modalDismissArea} onPress={closePicker} />
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <Pressable onPress={closePicker} style={webPointer}>
                  <Text style={formStyles.link}>Anuluj</Text>
                </Pressable>
                <Text style={styles.modalTitle}>Wybierz datę</Text>
                <Pressable onPress={confirmPicker} style={webPointer}>
                  <Text style={[formStyles.link, styles.modalDone]}>Gotowe</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={draftDate}
                mode="date"
                display="inline"
                locale="pl-PL"
                onChange={(_, selectedDate) => {
                  if (selectedDate) {
                    setDraftDate(selectedDate);
                  }
                }}
                style={styles.iosPicker}
              />
            </View>
          </View>
        </Modal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    backgroundColor: '#FAFCFA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerPlaceholder: {
    backgroundColor: '#FAFCFA',
  },
  triggerDisabled: {
    opacity: 0.7,
  },
  triggerText: {
    color: colors.text,
    fontSize: 16,
    flex: 1,
  },
  triggerTextPlaceholder: {
    color: colors.textMuted,
  },
  triggerIcon: {
    fontSize: 18,
    marginLeft: 12,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(8, 28, 21, 0.35)',
  },
  modalDismissArea: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  modalDone: {
    fontWeight: '700',
  },
  iosPicker: {
    alignSelf: 'center',
  },
});
