import { TabList, TabSlot, Tabs, TabTrigger } from 'expo-router/ui';
import { StyleSheet, View } from 'react-native';

import { TabButton } from '@/components/tab-button.web';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

export default function CustomerTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <View style={styles.tabListContainer}>
          <ThemedView type="backgroundElement" style={styles.innerContainer}>
            <ThemedText type="smallBold" style={styles.brandText}>
              FarmConnect
            </ThemedText>
            <TabTrigger name="index" href="/(customer)" asChild>
              <TabButton>Home</TabButton>
            </TabTrigger>
            <TabTrigger name="map" href="/(customer)/map" asChild>
              <TabButton>Map</TabButton>
            </TabTrigger>
            <TabTrigger name="bookings" href="/(customer)/bookings" asChild>
              <TabButton>Bookings</TabButton>
            </TabTrigger>
            <TabTrigger name="eid" href="/(customer)/eid" asChild>
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
