import { TabList, Tabs, TabSlot, TabTrigger } from "expo-router/ui";
import { Button } from "heroui-native";
import { StyleSheet } from "react-native";

import { TabButton } from "@/components/tab-button.web";
import { ThemedText } from "@/components/themed-text";
import { Colors, MaxContentWidth, Spacing } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";

export default function VendorTabs() {
  const { signOut } = useAuth();

  return (
    <Tabs>
      <TabSlot style={{ height: "100%" }} />
      <TabList style={styles.tabList}>
        <ThemedText type="smallBold" style={styles.brandText}>
          Vendor
        </ThemedText>
        <TabTrigger name="index" href="/(vendor)" asChild>
          <TabButton>My Farm</TabButton>
        </TabTrigger>
        <TabTrigger name="inventory" href="/(vendor)/inventory" asChild>
          <TabButton>Items</TabButton>
        </TabTrigger>
        <TabTrigger name="schedule" href="/(vendor)/schedule" asChild>
          <TabButton>Slaughter</TabButton>
        </TabTrigger>
        <TabTrigger name="bookings" href="/(vendor)/bookings" asChild>
          <TabButton>Bookings</TabButton>
        </TabTrigger>
        <TabTrigger name="eid" href="/(vendor)/eid" asChild>
          <TabButton>Eid</TabButton>
        </TabTrigger>
        <Button
          size="sm"
          variant="secondary"
          onPress={() => void signOut()}
          style={styles.signOut}
        >
          Sign out
        </Button>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabList: {
    position: "absolute",
    width: "100%",
    alignSelf: "center",
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
  signOut: {
    marginLeft: Spacing.two,
  },
});
