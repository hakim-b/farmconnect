import { TabList, Tabs, TabSlot, TabTrigger } from "expo-router/ui";
import { StyleSheet } from "react-native";

import { TabButton } from "@/components/tab-button.web";
import { ThemedText } from "@/components/themed-text";
import { Colors, MaxContentWidth, Spacing } from "@/constants/theme";

export default function CustomerTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: "100%" }} />
      <TabList style={styles.tabList}>
        <ThemedText type="smallBold" style={styles.brandText}>
          FarmConnect
        </ThemedText>
        <TabTrigger name="index" href="/(customer)" asChild>
          <TabButton>Home</TabButton>
        </TabTrigger>
        <TabTrigger name="map" href="/(customer)/map" asChild>
          <TabButton>Map</TabButton>
        </TabTrigger>
        <TabTrigger name="cart" href="/(customer)/cart" asChild>
          <TabButton>Cart</TabButton>
        </TabTrigger>
        <TabTrigger name="bookings" href="/(customer)/bookings" asChild>
          <TabButton>Bookings</TabButton>
        </TabTrigger>
        <TabTrigger name="eid" href="/(customer)/eid" asChild>
          <TabButton>Eid</TabButton>
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabList: {
    position: "absolute",
    width: "100%",
    padding: Spacing.three,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.five,
    flexDirection: "row",
    alignItems: "center",
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
    backgroundColor: Colors.light.backgroundElement,
  },
  brandText: {
    marginRight: "auto",
  },
});
