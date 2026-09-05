import { TabList, TabSlot, Tabs, TabTrigger } from 'expo-router/ui';
import { StyleSheet, View } from 'react-native';

import { TabButton } from '@/components/tab-button.web';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

export default function VendorTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <View style={styles.tabListContainer}>
          <ThemedView type="backgroundElement" style={styles.innerContainer}>
            <ThemedText type="smallBold" style={styles.brandText}>
              Vendor
            </ThemedText>
            <TabTrigger name="index" href="/(vendor)" asChild>
              <TabButton>Dashboard</TabButton>
            </TabTrigger>
            <TabTrigger name="inventory" href="/(vendor)/inventory" asChild>
              <TabButton>Inventory</TabButton>
            </TabTrigger>
            <TabTrigger name="schedule" href="/(vendor)/schedule" asChild>
              <TabButton>Schedule</TabButton>
            </TabTrigger>
            <TabTrigger name="bookings" href="/(vendor)/bookings" asChild>
              <TabButton>Bookings</TabButton>
            </TabTrigger>
            <TabTrigger name="eid" href="/(vendor)/eid" asChild>
              <TabButton>Eid</TabButton>
            </TabTrigger>
          </ThemedView>
        </View>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
  },
  brandText: {
    marginRight: 'auto',
  },
});
