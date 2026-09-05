insert into public.profiles (clerk_user_id, role, display_name)
values ('seed_vendor', 'vendor', 'FarmConnect Demo Farms');

with owner as (
  select id from public.profiles where clerk_user_id = 'seed_vendor'
),
inserted_farms as (
  insert into public.farms (
    owner_profile_id,
    name,
    slug,
    description,
    farm_type,
    thumbnail_url,
    address_line,
    city,
    region,
    latitude,
    longitude,
    average_rating,
    review_count,
    is_published,
    eid_enabled
  )
  select
    owner.id,
    farm.name,
    farm.slug,
    farm.description,
    farm.farm_type,
    farm.thumbnail_url,
    farm.address_line,
    farm.city,
    farm.region,
    farm.latitude,
    farm.longitude,
    farm.average_rating,
    farm.review_count,
    true,
    farm.eid_enabled
  from owner
  cross join (
    values
      (
        'Al-Barakah Meats',
        'al-barakah-meats',
        'Family-run halal slaughterhouse serving Southeast Michigan. Whole-animal shares, Eid bookings, and same-week processing.',
        'slaughter_only',
        'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1200&q=80',
        '8820 Textile Rd',
        'Ypsilanti',
        'MI',
        42.228410,
        -83.614920,
        4.80,
        126,
        true
      ),
      (
        'Green Valley Farm',
        'green-valley-farm',
        'Organic produce, grass-fed meats, and weekend farm-stand baskets just west of Ann Arbor.',
        'mixed',
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
        '4100 W Liberty Rd',
        'Ann Arbor',
        'MI',
        42.273110,
        -83.837540,
        4.60,
        89,
        false
      ),
      (
        'Sunrise Orchard',
        'sunrise-orchard',
        'U-pick apples, peaches, and berries with wagon tours through 40 acres of orchard.',
        'produce_and_meats',
        'https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=1200&q=80',
        '7200 Plymouth Rd',
        'Dexter',
        'MI',
        42.338920,
        -83.888210,
        4.90,
        204,
        false
      ),
      (
        'Maple Ridge Farm',
        'maple-ridge-farm',
        'Certified organic vegetables, pasture-raised chicken, and seasonal farm dinners.',
        'mixed',
        'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1200&q=80',
        '1550 N Territorial Rd',
        'Saline',
        'MI',
        42.176540,
        -83.781220,
        4.40,
        57,
        true
      )
  ) as farm (
    name,
    slug,
    description,
    farm_type,
    thumbnail_url,
    address_line,
    city,
    region,
    latitude,
    longitude,
    average_rating,
    review_count,
    eid_enabled
  )
  returning id, slug
)
insert into public.farm_certifications (farm_id, label, is_verified)
select f.id, cert.label, true
from inserted_farms f
join (
  values
    ('al-barakah-meats', 'Halal Certified'),
    ('al-barakah-meats', 'Grass-Fed'),
    ('green-valley-farm', 'Organic'),
    ('green-valley-farm', 'Grass-Fed'),
    ('green-valley-farm', 'Halal Certified'),
    ('sunrise-orchard', 'Organic'),
    ('maple-ridge-farm', 'Organic'),
    ('maple-ridge-farm', 'Halal Certified')
) as cert (slug, label) on cert.slug = f.slug;

insert into public.products (
  farm_id, category, name, description, image_url, pricing_type, unit, price, sale_price, is_on_sale, stock_quantity
)
select f.id, p.category, p.name, p.description, p.image_url, p.pricing_type, p.unit, p.price, p.sale_price, p.is_on_sale, p.stock_quantity
from public.farms f
join (
  values
    (
      'green-valley-farm',
      'produce',
      'Heirloom Tomato Basket',
      'Mixed heirloom tomatoes picked this morning.',
      'https://images.unsplash.com/photo-1546470427-227c7369a62c?auto=format&fit=crop&w=800&q=80',
      'fixed',
      'basket',
      18.00,
      14.00,
      true,
      24
    ),
    (
      'green-valley-farm',
      'meat',
      'Grass-Fed Ground Beef',
      'Pasture-raised, packed in 1 lb portions.',
      'https://images.unsplash.com/photo-1603048297172-c92544798d5e?auto=format&fit=crop&w=800&q=80',
      'weight',
      'lb',
      9.50,
      8.00,
      true,
      60
    ),
    (
      'green-valley-farm',
      'produce',
      'Salad Greens Mix',
      'Baby kale, arugula, and oak leaf lettuce.',
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
      'fixed',
      'bag',
      6.00,
      null,
      false,
      40
    ),
    (
      'sunrise-orchard',
      'produce',
      'Honeycrisp Half-Bushel',
      'Crisp, sweet apples — this week''s pick.',
      'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=800&q=80',
      'fixed',
      'basket',
      32.00,
      26.00,
      true,
      18
    ),
    (
      'sunrise-orchard',
      'produce',
      'Fresh Peach Box',
      'Tree-ripened peaches, about 8 lbs.',
      'https://images.unsplash.com/photo-1595743825817-d2c2f43d0dde?auto=format&fit=crop&w=800&q=80',
      'fixed',
      'box',
      22.00,
      null,
      false,
      12
    ),
    (
      'maple-ridge-farm',
      'meat',
      'Pasture-Raised Whole Chicken',
      'Air-chilled, about 4 lb birds.',
      'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=800&q=80',
      'fixed',
      'item',
      21.00,
      17.50,
      true,
      15
    ),
    (
      'maple-ridge-farm',
      'produce',
      'Organic Carrot Bunch',
      'Sweet Nantes carrots with greens on.',
      'https://images.unsplash.com/photo-1447175008436-054170c2e979?auto=format&fit=crop&w=800&q=80',
      'fixed',
      'bunch',
      4.50,
      null,
      false,
      50
    )
) as p (
  slug, category, name, description, image_url, pricing_type, unit, price, sale_price, is_on_sale, stock_quantity
) on p.slug = f.slug;

insert into public.slaughter_offerings (
  farm_id, animal_type, name, description, image_url, price, yield_notes, max_split_participants
)
select f.id, s.animal_type, s.name, s.description, s.image_url, s.price, s.yield_notes, s.max_split_participants
from public.farms f
join (
  values
    (
      'al-barakah-meats',
      'goat',
      'Whole Goat Share',
      'Halal-slaughtered goat, typically 25–35 lb hanging weight.',
      'https://images.unsplash.com/photo-1524024973431-2ad916746881?auto=format&fit=crop&w=800&q=80',
      325.00,
      'Feeds 6–10. Invite up to 3 others to split cost and cuts.',
      4
    ),
    (
      'al-barakah-meats',
      'lamb',
      'Whole Lamb Share',
      'Spring lamb, custom cut available after slaughter.',
      'https://images.unsplash.com/photo-1484557985045-edf25e08da73?auto=format&fit=crop&w=800&q=80',
      280.00,
      'Feeds 5–8. Popular for family gatherings.',
      4
    ),
    (
      'al-barakah-meats',
      'cow',
      'Quarter Cow',
      'Grass-fed beef quarter with standard cut sheet.',
      'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=800&q=80',
      890.00,
      'About 80–100 lb boxed. Split with one partner if needed.',
      2
    ),
    (
      'maple-ridge-farm',
      'lamb',
      'Farmstead Lamb',
      'Pasture-raised lamb processed on-site during Eid season.',
      'https://images.unsplash.com/photo-1484557985045-edf25e08da73?auto=format&fit=crop&w=800&q=80',
      310.00,
      'Whole animal. Invite family to split.',
      4
    )
) as s (
  slug, animal_type, name, description, image_url, price, yield_notes, max_split_participants
) on s.slug = f.slug;

insert into public.activities (
  farm_id, name, description, image_url, price, duration_minutes, max_guests
)
select f.id, a.name, a.description, a.image_url, a.price, a.duration_minutes, a.max_guests
from public.farms f
join (
  values
    (
      'sunrise-orchard',
      'U-Pick Apples',
      'Wagon ride to the rows, pick your own Honeycrisp and Gala. Bags included.',
      'https://images.unsplash.com/photo-1570913149827-d2afd686b875?auto=format&fit=crop&w=800&q=80',
      12.00,
      90,
      8
    ),
    (
      'sunrise-orchard',
      'Orchard Tour',
      'Guided walking tour of the orchard, packing shed, and cider press.',
      'https://images.unsplash.com/photo-1471193945509-9ad0617affc1?auto=format&fit=crop&w=800&q=80',
      8.00,
      45,
      20
    ),
    (
      'green-valley-farm',
      'Farm Stand Saturday',
      'Walk the vegetable rows and fill a basket with the farmer.',
      'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=800&q=80',
      0.00,
      60,
      15
    ),
    (
      'maple-ridge-farm',
      'Petting Zoo Hour',
      'Meet goats, sheep, and chickens. Great for kids.',
      'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=800&q=80',
      6.00,
      45,
      12
    )
) as a (slug, name, description, image_url, price, duration_minutes, max_guests)
  on a.slug = f.slug;

insert into public.availability_slots (farm_id, slot_type, starts_at, ends_at, capacity, remaining)
select f.id, s.slot_type, s.starts_at, s.ends_at, s.capacity, s.remaining
from public.farms f
join (
  values
    ('al-barakah-meats', 'slaughter', timestamptz '2026-09-12 09:00:00-04', timestamptz '2026-09-12 10:00:00-04', 4, 4),
    ('al-barakah-meats', 'slaughter', timestamptz '2026-09-12 10:30:00-04', timestamptz '2026-09-12 11:30:00-04', 4, 3),
    ('al-barakah-meats', 'slaughter', timestamptz '2026-09-13 09:00:00-04', timestamptz '2026-09-13 10:00:00-04', 4, 4),
    ('maple-ridge-farm', 'slaughter', timestamptz '2026-09-14 08:00:00-04', timestamptz '2026-09-14 09:00:00-04', 2, 2),
    ('sunrise-orchard', 'activity', timestamptz '2026-09-13 10:00:00-04', timestamptz '2026-09-13 11:30:00-04', 8, 8),
    ('sunrise-orchard', 'activity', timestamptz '2026-09-14 10:00:00-04', timestamptz '2026-09-14 11:30:00-04', 8, 5),
    ('green-valley-farm', 'activity', timestamptz '2026-09-13 09:00:00-04', timestamptz '2026-09-13 10:00:00-04', 15, 15),
    ('maple-ridge-farm', 'activity', timestamptz '2026-09-13 11:00:00-04', timestamptz '2026-09-13 11:45:00-04', 12, 12)
) as s (slug, slot_type, starts_at, ends_at, capacity, remaining)
  on s.slug = f.slug;
