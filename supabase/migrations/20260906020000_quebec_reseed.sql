-- Replace the demo farms with Québec farms within ~50 km of Montréal.
-- Run this once in the Supabase dashboard → SQL Editor (after the earlier
-- migrations). Safe to re-run: it deletes the seed vendor's farms first and
-- everything under them cascades.

-- Make sure the price-tier column + helper exist (they come from
-- 20260905210000_farm_price_tier.sql; this re-declares them so the reseed
-- works even if that migration was never applied).
alter table public.farms
  add column if not exists price_tier smallint not null default 2;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'farms_price_tier_check') then
    alter table public.farms
      add constraint farms_price_tier_check check (price_tier between 1 and 3);
  end if;
end;
$$;

create or replace function private.farm_price_tier(p_farm_id bigint)
returns smallint
language sql
stable
security definer
set search_path = ''
as $$
  with prices as (
    select price from public.products
      where farm_id = p_farm_id and is_available and price > 0
    union all
    select price from public.activities
      where farm_id = p_farm_id and is_available and price > 0
    union all
    select price from public.slaughter_offerings
      where farm_id = p_farm_id and is_available and price > 0
  )
  select case
    when min(price) is null then 2
    when min(price) < 25 then 1
    when min(price) < 75 then 2
    else 3
  end::smallint
  from prices;
$$;

revoke all on function private.farm_price_tier(bigint) from public;

insert into public.profiles (clerk_user_id, role, display_name)
values ('seed_vendor', 'vendor', 'FarmConnect Demo Farms')
on conflict (clerk_user_id) do nothing;

delete from public.farms
where owner_profile_id = (select id from public.profiles where clerk_user_id = 'seed_vendor');

with owner as (
  select id from public.profiles where clerk_user_id = 'seed_vendor'
),
inserted_farms as (
  insert into public.farms (
    owner_profile_id, name, slug, description, farm_type, thumbnail_url,
    address_line, city, region, latitude, longitude,
    average_rating, review_count, is_published, eid_enabled
  )
  select
    owner.id, farm.name, farm.slug, farm.description, farm.farm_type, farm.thumbnail_url,
    farm.address_line, farm.city, farm.region, farm.latitude, farm.longitude,
    farm.average_rating, farm.review_count, true, farm.eid_enabled
  from owner
  cross join (
    values
      (
        'Abattoir Al-Rizq',
        'abattoir-al-rizq',
        'Abattoir halal familial en Montérégie. Parts d''animaux entiers, réservations pour l''Aïd et découpe la même semaine.',
        'slaughter_only',
        'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1200&q=80',
        '312 Rang Saint-Édouard',
        'Napierville',
        'QC',
        45.190400,
        -73.402100,
        4.80,
        141,
        true
      ),
      (
        'Ferme Verte du Suroît',
        'ferme-verte-du-suroit',
        'Maraîchage biologique et viandes nourries à l''herbe au cœur du jardin du Québec, à Saint-Rémi.',
        'mixed',
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
        '875 Rang Saint-Paul',
        'Saint-Rémi',
        'QC',
        45.262900,
        -73.607400,
        4.60,
        97,
        false
      ),
      (
        'Verger du Mont-Rouge',
        'verger-du-mont-rouge',
        'Autocueillette de pommes, cidrerie et visites en tracteur sur 40 acres à Rougemont.',
        'produce_and_meats',
        'https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=1200&q=80',
        '1180 La Grande-Caroline',
        'Rougemont',
        'QC',
        45.437200,
        -73.043600,
        4.90,
        228,
        false
      ),
      (
        'Ferme Racine & Cie',
        'ferme-racine-et-cie',
        'Légumes certifiés bio, poulet élevé au pâturage et soupers à la ferme à Laval (Sainte-Dorothée).',
        'mixed',
        'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1200&q=80',
        '2040 Chemin du Bord-de-l''eau',
        'Laval',
        'QC',
        45.535200,
        -73.809600,
        4.40,
        63,
        true
      )
  ) as farm (
    name, slug, description, farm_type, thumbnail_url,
    address_line, city, region, latitude, longitude,
    average_rating, review_count, eid_enabled
  )
  returning id, slug
)
insert into public.farm_certifications (farm_id, label, is_verified)
select f.id, cert.label, true
from inserted_farms f
join (
  values
    ('abattoir-al-rizq', 'Halal Certified'),
    ('abattoir-al-rizq', 'Grass-Fed'),
    ('ferme-verte-du-suroit', 'Organic'),
    ('ferme-verte-du-suroit', 'Grass-Fed'),
    ('ferme-verte-du-suroit', 'Halal Certified'),
    ('verger-du-mont-rouge', 'Organic'),
    ('ferme-racine-et-cie', 'Organic'),
    ('ferme-racine-et-cie', 'Halal Certified')
) as cert (slug, label) on cert.slug = f.slug;

insert into public.products (
  farm_id, category, name, description, image_url, pricing_type, unit, price, sale_price, is_on_sale, stock_quantity
)
select f.id, p.category, p.name, p.description, p.image_url, p.pricing_type, p.unit, p.price, p.sale_price, p.is_on_sale, p.stock_quantity
from public.farms f
join (
  values
    (
      'ferme-verte-du-suroit', 'produce', 'Blé d''Inde sucré (Sweet Corn)',
      'Épluchette-ready, cueilli le matin même. Douzaine.',
      'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=80',
      'fixed', 'dozen', 8.00, 6.00, true, 40
    ),
    (
      'ferme-verte-du-suroit', 'produce', 'Panier de tomates de champ',
      'Tomates rouges et anciennes, mûries au soleil.',
      'https://images.unsplash.com/photo-1546470427-227c7369a62c?auto=format&fit=crop&w=800&q=80',
      'fixed', 'basket', 18.00, 14.00, true, 24
    ),
    (
      'ferme-verte-du-suroit', 'meat', 'Bœuf haché nourri à l''herbe',
      'Élevé au pâturage, portions de 500 g.',
      'https://images.unsplash.com/photo-1603048297172-c92544798d5e?auto=format&fit=crop&w=800&q=80',
      'weight', 'kg', 21.00, 18.00, true, 55
    ),
    (
      'ferme-verte-du-suroit', 'produce', 'Mesclun biologique',
      'Jeune kale, roquette et laitue feuille de chêne.',
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
      'fixed', 'bag', 6.00, null, false, 40
    ),
    (
      'verger-du-mont-rouge', 'produce', 'Demi-minot de pommes Cortland',
      'Croquantes et acidulées — la cueillette de la semaine.',
      'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=800&q=80',
      'fixed', 'basket', 28.00, 22.00, true, 18
    ),
    (
      'verger-du-mont-rouge', 'produce', 'Cidre frais non filtré',
      'Pressé au verger, 1 L. Se conserve 2 semaines au froid.',
      'https://images.unsplash.com/photo-1595743825817-d2c2f43d0dde?auto=format&fit=crop&w=800&q=80',
      'fixed', 'bottle', 9.00, null, false, 30
    ),
    (
      'ferme-racine-et-cie', 'meat', 'Poulet entier de pâturage',
      'Refroidi à l''air, environ 1,8 kg.',
      'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=800&q=80',
      'fixed', 'item', 24.00, 19.50, true, 15
    ),
    (
      'ferme-racine-et-cie', 'produce', 'Botte de carottes biologiques',
      'Carottes Nantes sucrées, fanes incluses.',
      'https://images.unsplash.com/photo-1447175008436-054170c2e979?auto=format&fit=crop&w=800&q=80',
      'fixed', 'bunch', 4.50, null, false, 50
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
      'abattoir-al-rizq', 'lamb', 'Agneau entier (Whole Lamb)',
      'Agneau du Québec abattu halal, découpe personnalisée disponible.',
      'https://images.unsplash.com/photo-1484557985045-edf25e08da73?auto=format&fit=crop&w=800&q=80',
      380.00, 'Nourrit 5 à 8. Populaire pour les rassemblements familiaux.', 4
    ),
    (
      'abattoir-al-rizq', 'goat', 'Chèvre entière (Whole Goat)',
      'Chèvre abattue halal, 12 à 16 kg de poids carcasse.',
      'https://images.unsplash.com/photo-1524024973431-2ad916746881?auto=format&fit=crop&w=800&q=80',
      340.00, 'Nourrit 6 à 10. Invitez jusqu''à 3 personnes pour partager.', 4
    ),
    (
      'abattoir-al-rizq', 'cow', 'Quart de bœuf (Quarter Beef)',
      'Quart de bœuf nourri à l''herbe avec feuille de coupe standard.',
      'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=800&q=80',
      950.00, 'Environ 40 kg emballés. Partagez avec un partenaire.', 2
    ),
    (
      'ferme-racine-et-cie', 'lamb', 'Agneau de la ferme',
      'Agneau élevé au pâturage, transformé sur place durant l''Aïd.',
      'https://images.unsplash.com/photo-1484557985045-edf25e08da73?auto=format&fit=crop&w=800&q=80',
      360.00, 'Animal entier. Invitez la famille à partager.', 4
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
      'verger-du-mont-rouge', 'Autocueillette de pommes',
      'Balade en tracteur jusqu''aux rangs, cueillez vos Cortland et Honeycrisp. Sacs fournis.',
      'https://images.unsplash.com/photo-1570913149827-d2afd686b875?auto=format&fit=crop&w=800&q=80',
      12.00, 90, 8
    ),
    (
      'verger-du-mont-rouge', 'Visite de la cidrerie',
      'Visite guidée du verger, de l''entrepôt et du pressoir à cidre.',
      'https://images.unsplash.com/photo-1471193945509-9ad0617affc1?auto=format&fit=crop&w=800&q=80',
      8.00, 45, 20
    ),
    (
      'ferme-verte-du-suroit', 'Marché à la ferme',
      'Parcourez les rangs de légumes et remplissez un panier avec le maraîcher.',
      'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=800&q=80',
      0.00, 60, 15
    ),
    (
      'ferme-racine-et-cie', 'Mini-ferme (Petting Zoo)',
      'Rencontrez chèvres, moutons et poules. Parfait pour les enfants.',
      'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=800&q=80',
      6.00, 45, 12
    )
) as a (slug, name, description, image_url, price, duration_minutes, max_guests)
  on a.slug = f.slug;

insert into public.availability_slots (farm_id, slot_type, starts_at, ends_at, capacity, remaining)
select f.id, s.slot_type, s.starts_at, s.ends_at, s.capacity, s.remaining
from public.farms f
join (
  values
    ('abattoir-al-rizq', 'slaughter', timestamptz '2026-09-19 09:00:00-04', timestamptz '2026-09-19 10:00:00-04', 4, 4),
    ('abattoir-al-rizq', 'slaughter', timestamptz '2026-09-19 10:30:00-04', timestamptz '2026-09-19 11:30:00-04', 4, 3),
    ('abattoir-al-rizq', 'slaughter', timestamptz '2026-09-20 09:00:00-04', timestamptz '2026-09-20 10:00:00-04', 4, 4),
    ('ferme-racine-et-cie', 'slaughter', timestamptz '2026-09-21 08:00:00-04', timestamptz '2026-09-21 09:00:00-04', 2, 2),
    ('verger-du-mont-rouge', 'activity', timestamptz '2026-09-20 10:00:00-04', timestamptz '2026-09-20 11:30:00-04', 8, 8),
    ('verger-du-mont-rouge', 'activity', timestamptz '2026-09-21 10:00:00-04', timestamptz '2026-09-21 11:30:00-04', 8, 5),
    ('ferme-verte-du-suroit', 'activity', timestamptz '2026-09-20 09:00:00-04', timestamptz '2026-09-20 10:00:00-04', 15, 15),
    ('ferme-racine-et-cie', 'activity', timestamptz '2026-09-20 11:00:00-04', timestamptz '2026-09-20 11:45:00-04', 12, 12)
) as s (slug, slot_type, starts_at, ends_at, capacity, remaining)
  on s.slug = f.slug;

-- keep the map's $/$$/$$$ label current
update public.farms f set price_tier = private.farm_price_tier(f.id)
where f.owner_profile_id = (select id from public.profiles where clerk_user_id = 'seed_vendor');
