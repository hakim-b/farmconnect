import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Button } from 'heroui-native';

import { EmptyState, LoadingScreen, Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useVendorFarm } from '@/hooks/use-vendor-farm';
import { formatPrice, type Activity, type Product, type SlaughterOffering } from '@/lib/types';

type EditingKind = 'product' | 'slaughter' | 'activity';
type EditingTarget = { kind: EditingKind; id: number } | null;

export default function VendorInventoryScreen() {
  const theme = useTheme();
  const { farm, loading, supabase } = useVendorFarm();
  const [products, setProducts] = useState<Product[]>([]);
  const [offerings, setOfferings] = useState<SlaughterOffering[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [kind, setKind] = useState<'produce' | 'meat' | 'slaughter' | 'activity'>('produce');
  const [stock, setStock] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditingTarget>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editSalePrice, setEditSalePrice] = useState('');

  const load = useCallback(async () => {
    if (!farm) return;
    const [productRes, offeringRes, activityRes] = await Promise.all([
      supabase.from('products').select('*').eq('farm_id', farm.id).order('name'),
      supabase.from('slaughter_offerings').select('*').eq('farm_id', farm.id).order('name'),
      supabase.from('activities').select('*').eq('farm_id', farm.id).order('name'),
    ]);
    setProducts((productRes.data as Product[]) ?? []);
    setOfferings((offeringRes.data as SlaughterOffering[]) ?? []);
    setActivities((activityRes.data as Activity[]) ?? []);
  }, [farm, supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingScreen />;
  if (!farm) {
    return (
      <Screen>
        <EmptyState title="Create a farm first" body="Your dashboard has the farm profile form." />
      </Screen>
    );
  }

  async function addItem() {
    if (!farm) return;
    const amount = Number(price);
    if (!name.trim() || Number.isNaN(amount)) {
      setError('Name and a numeric price are required.');
      return;
    }
    setError(null);
    if (kind === 'slaughter') {
      const { error: saveError } = await supabase.from('slaughter_offerings').insert({
        farm_id: farm.id,
        animal_type: name.trim().toLowerCase(),
        name: name.trim(),
        price: amount,
      });
      if (saveError) setError(saveError.message);
    } else if (kind === 'activity') {
      const { error: saveError } = await supabase.from('activities').insert({
        farm_id: farm.id,
        name: name.trim(),
        price: amount,
      });
      if (saveError) setError(saveError.message);
    } else {
      const { error: saveError } = await supabase.from('products').insert({
        farm_id: farm.id,
        category: kind,
        name: name.trim(),
        pricing_type: kind === 'meat' ? 'weight' : 'fixed',
        unit: kind === 'meat' ? 'lb' : 'item',
        price: amount,
        stock_quantity: stock ? Number(stock) : null,
      });
      if (saveError) setError(saveError.message);
    }
    setName('');
    setPrice('');
    setStock('');
    await load();
  }

  function startEdit(kindOf: EditingKind, item: { id: number; name: string; price: number; stock?: number | null }) {
    setEditing({ kind: kindOf, id: item.id });
    setEditName(item.name);
    setEditPrice(String(item.price));
    setEditStock(item.stock != null ? String(item.stock) : '');
    setEditSalePrice('');
  }

  async function saveEdit() {
    const current = editing;
    if (!current) return;
    const amount = Number(editPrice);
    if (!editName.trim() || Number.isNaN(amount)) {
      setError('Name and a numeric price are required.');
      return;
    }
    setError(null);
    const patch: Record<string, unknown> = { name: editName.trim(), price: amount };
    if (current.kind === 'product') {
      patch.stock_quantity = editStock ? Number(editStock) : null;
      if (editSalePrice !== '') {
        const sale = Number(editSalePrice);
        if (!Number.isNaN(sale) && sale < amount) {
          patch.sale_price = sale;
          patch.is_on_sale = true;
        }
      }
    }
    const table =
      current.kind === 'slaughter' ? 'slaughter_offerings' : current.kind === 'activity' ? 'activities' : 'products';
    const { error: updateError } = await supabase.from(table).update(patch).eq('id', current.id);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setEditing(null);
    await load();
  }

  async function remove(kindOf: EditingKind, id: number) {
    const table = kindOf === 'slaughter' ? 'slaughter_offerings' : kindOf === 'activity' ? 'activities' : 'products';
    const { error: deleteError } = await supabase.from(table).delete().eq('id', id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setEditing(null);
    await load();
  }

  async function toggleProductAvailability(product: Product) {
    const { error: updateError } = await supabase
      .from('products')
      .update({ is_available: !product.is_available })
      .eq('id', product.id);
    if (!updateError) await load();
    else setError(updateError.message);
  }

  async function toggleProductSale(product: Product) {
    const onSale = !product.is_on_sale;
    const salePrice =
      onSale && product.sale_price == null ? Math.round(product.price * 0.9 * 100) / 100 : null;
    const { error: updateError } = await supabase
      .from('products')
      .update({ is_on_sale: onSale, sale_price: onSale && salePrice != null ? salePrice : null })
      .eq('id', product.id);
    if (!updateError) await load();
    else setError(updateError.message);
  }

  async function toggleSlaughterAvailable(offering: SlaughterOffering) {
    const { error: updateError } = await supabase
      .from('slaughter_offerings')
      .update({ is_available: !offering.is_available })
      .eq('id', offering.id);
    if (!updateError) await load();
    else setError(updateError.message);
  }

  async function toggleActivityAvailable(activity: Activity) {
    const { error: updateError } = await supabase
      .from('activities')
      .update({ is_available: !activity.is_available })
      .eq('id', activity.id);
    if (!updateError) await load();
    else setError(updateError.message);
  }

  const inputStyle = [
    styles.input,
    { color: theme.text, borderColor: theme.backgroundSelected },
  ];

  return (
    <Screen>
      <ThemedText type="subtitle">Inventory</ThemedText>
      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText type="smallBold">Add an offering</ThemedText>
        <View style={styles.row}>
          {(['produce', 'meat', 'slaughter', 'activity'] as const).map((value) => (
            <Button
              key={value}
              size="sm"
              variant={kind === value ? 'primary' : 'secondary'}
              onPress={() => setKind(value)}>
              {value}
            </Button>
          ))}
        </View>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Name"
          placeholderTextColor={theme.textSecondary}
          style={inputStyle}
        />
        <TextInput
          value={price}
          onChangeText={setPrice}
          placeholder="Price"
          keyboardType="decimal-pad"
          placeholderTextColor={theme.textSecondary}
          style={inputStyle}
        />
        {kind === 'produce' || kind === 'meat' ? (
          <TextInput
            value={stock}
            onChangeText={setStock}
            placeholder="Stock (optional)"
            keyboardType="decimal-pad"
            placeholderTextColor={theme.textSecondary}
            style={inputStyle}
          />
        ) : null}
        {error ? (
          <ThemedText type="small" style={styles.error}>
            {error}
          </ThemedText>
        ) : null}
        <Button onPress={addItem}>Add</Button>
      </ThemedView>

      {editing ? (
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="smallBold">Edit item</ThemedText>
          <TextInput
            value={editName}
            onChangeText={setEditName}
            placeholder="Name"
            placeholderTextColor={theme.textSecondary}
            style={inputStyle}
          />
          <TextInput
            value={editPrice}
            onChangeText={setEditPrice}
            placeholder="Price"
            keyboardType="decimal-pad"
            placeholderTextColor={theme.textSecondary}
            style={inputStyle}
          />
          {editing.kind === 'product' ? (
            <TextInput
              value={editStock}
              onChangeText={setEditStock}
              placeholder="Stock (optional)"
              keyboardType="decimal-pad"
              placeholderTextColor={theme.textSecondary}
              style={inputStyle}
            />
          ) : null}
          {editing.kind === 'product' ? (
            <TextInput
              value={editSalePrice}
              onChangeText={setEditSalePrice}
              placeholder="Sale price (optional)"
              keyboardType="decimal-pad"
              placeholderTextColor={theme.textSecondary}
              style={inputStyle}
            />
          ) : null}
          <View style={styles.row}>
            <Button onPress={saveEdit}>Save</Button>
            <Button size="sm" variant="secondary" onPress={() => setEditing(null)}>
              Cancel
            </Button>
          </View>
        </ThemedView>
      ) : null}

      <ThemedText type="smallBold">Produce & meats</ThemedText>
      {products.length === 0 ? (
        <EmptyState title="No products" body="Add produce or meat above." />
      ) : (
        products.map((product) => {
          const price = product.is_on_sale && product.sale_price != null ? product.sale_price : product.price;
          return (
            <ThemedView key={product.id} type="backgroundElement" style={styles.card}>
              <View style={styles.header}>
                <View style={styles.copy}>
                  <ThemedText type="smallBold">{product.name}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {formatPrice(price, product.pricing_type, product.unit)}
                    {product.is_on_sale ? ' · on sale' : ''}
                    {!product.is_available ? ' · hidden' : ''}
                    {product.stock_quantity != null ? ` · stock ${product.stock_quantity}` : ''}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.row}>
                <Button
                  size="sm"
                  variant={product.is_available ? 'secondary' : 'primary'}
                  onPress={() => toggleProductAvailability(product)}>
                  {product.is_available ? 'Hide' : 'Show'}
                </Button>
                <Button size="sm" variant="secondary" onPress={() => toggleProductSale(product)}>
                  {product.is_on_sale ? 'Clear sale' : 'Put on sale'}
                </Button>
                <Button size="sm" variant="secondary" onPress={() => startEdit('product', product)}>
                  Edit
                </Button>
                <Button size="sm" variant="secondary" onPress={() => remove('product', product.id)}>
                  Remove
                </Button>
              </View>
            </ThemedView>
          );
        })
      )}

      <ThemedText type="smallBold">Slaughter</ThemedText>
      {offerings.length === 0 ? (
        <EmptyState title="No slaughter offerings" body="Add whole-animal shares above." />
      ) : (
        offerings.map((offering) => (
          <ThemedView key={offering.id} type="backgroundElement" style={styles.card}>
            <View style={styles.copy}>
              <ThemedText type="smallBold">{offering.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {formatPrice(offering.price)}
                {!offering.is_available ? ' · hidden' : ''}
              </ThemedText>
            </View>
            <View style={styles.row}>
              <Button
                size="sm"
                variant={offering.is_available ? 'secondary' : 'primary'}
                onPress={() => toggleSlaughterAvailable(offering)}>
                {offering.is_available ? 'Hide' : 'Show'}
              </Button>
              <Button size="sm" variant="secondary" onPress={() => startEdit('slaughter', offering)}>
                Edit
              </Button>
              <Button size="sm" variant="secondary" onPress={() => remove('slaughter', offering.id)}>
                Remove
              </Button>
            </View>
          </ThemedView>
        ))
      )}

      <ThemedText type="smallBold">Activities</ThemedText>
      {activities.length === 0 ? (
        <EmptyState title="No activities" body="Add tours and experiences above." />
      ) : (
        activities.map((activity) => (
          <ThemedView key={activity.id} type="backgroundElement" style={styles.card}>
            <View style={styles.copy}>
              <ThemedText type="smallBold">{activity.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {activity.price === 0 ? 'Free' : formatPrice(activity.price)}
                {!activity.is_available ? ' · hidden' : ''}
              </ThemedText>
            </View>
            <View style={styles.row}>
              <Button
                size="sm"
                variant={activity.is_available ? 'secondary' : 'primary'}
                onPress={() => toggleActivityAvailable(activity)}>
                {activity.is_available ? 'Hide' : 'Show'}
              </Button>
              <Button size="sm" variant="secondary" onPress={() => startEdit('activity', activity)}>
                Edit
              </Button>
              <Button size="sm" variant="secondary" onPress={() => remove('activity', activity.id)}>
                Remove
              </Button>
            </View>
          </ThemedView>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  error: {
    color: '#B42318',
  },
});