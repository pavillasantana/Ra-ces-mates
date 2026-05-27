---
name: Heritage & Earth
colors:
  surface: '#fcf9f3'
  surface-dim: '#dcdad4'
  surface-bright: '#fcf9f3'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3ed'
  surface-container: '#f0eee8'
  surface-container-high: '#ebe8e2'
  surface-container-highest: '#e5e2dc'
  on-surface: '#1c1c18'
  on-surface-variant: '#434842'
  inverse-surface: '#31312d'
  inverse-on-surface: '#f3f0ea'
  outline: '#747872'
  outline-variant: '#c3c8c0'
  surface-tint: '#516352'
  primary: '#18281a'
  on-primary: '#ffffff'
  primary-container: '#2d3e2f'
  on-primary-container: '#96a995'
  inverse-primary: '#b8ccb7'
  secondary: '#934b19'
  on-secondary: '#ffffff'
  secondary-container: '#ffa26a'
  on-secondary-container: '#783603'
  tertiary: '#441600'
  on-tertiary: '#ffffff'
  tertiary-container: '#672500'
  on-tertiary-container: '#ff8040'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d4e8d3'
  primary-fixed-dim: '#b8ccb7'
  on-primary-fixed: '#0f1f12'
  on-primary-fixed-variant: '#3a4b3b'
  secondary-fixed: '#ffdbc9'
  secondary-fixed-dim: '#ffb68c'
  on-secondary-fixed: '#321200'
  on-secondary-fixed-variant: '#753401'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb595'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7c2e00'
  background: '#fcf9f3'
  on-background: '#1c1c18'
  surface-variant: '#e5e2dc'
typography:
  display-lg:
    fontFamily: Domine
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Domine
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Domine
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Domine
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Work Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Work Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Work Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Work Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
  section-gap: 80px
---

## Brand & Style

This design system centers on the concept of **Artesanal Heritage**. It is designed to bridge the gap between traditional Argentinian craftsmanship and a premium, modern e-commerce experience. The UI should evoke the sensory experience of a high-end *feria*—the smell of leather, the warmth of polished wood, and the ritual of shared mate.

The visual style is **Tactile Modernism**. It uses a sophisticated, grounded color palette and high-quality photography to make natural textures (leather grains, wood carves, metallic alpaca) the hero. The interface is clean and functional but avoids the coldness of standard tech by utilizing warm neutrals and organic shapes. The target audience is the discerning collector and the traditionalist who appreciates quality and authenticity.

## Colors

The palette is derived from the natural elements of the Argentinian pampa and the mate ritual:

*   **Primary (Deep Forest Green):** Representing the yerba mate leaf. Used for core branding, primary navigation, and high-level headings. It provides a grounded, sophisticated anchor for the design.
*   **Secondary (Saddle Brown):** Representing cured leather and wood. Used for secondary actions, subtle accents, and decorative elements.
*   **Tertiary (Rustic Orange):** An energetic accent color. Used sparingly for Call-to-Actions (CTAs), sale badges, and interactive highlights to provide contrast against the earthy tones.
*   **Neutral (Parchment):** A warm off-white background color that prevents the UI from feeling sterile. It mimics the look of natural fiber or high-quality paper.
*   **Success/Error:** Use a muted sage green for success and a deep terracotta for errors to maintain the earthy aesthetic.

## Typography

This design system uses a deliberate pairing of a sturdy serif and a functional sans-serif:

*   **Headlines (Domine):** Chosen for its authoritative yet warm character. It feels traditional and "bookish," grounding the brand in history and storytelling. Use for product names, section headers, and editorial storytelling.
*   **Body & UI (Work Sans):** A clean, professional sans-serif that ensures high legibility for product descriptions, price tags, and functional UI components. Its neutral character allows the photography and headlines to take center stage.
*   **Labels:** Use all-caps with slight letter-spacing for category labels and small metadata to create a "stamped" or "branded" leather effect.

## Layout & Spacing

The layout follows a **structured fluid grid** model. It prioritizes generous whitespace to allow the premium products to "breathe" and to convey a sense of luxury.

*   **Grid:** A 12-column system for desktop, 8-column for tablet, and 4-column for mobile.
*   **Vertical Rhythm:** Built on an 8px base unit. Section spacing is intentionally large (80px+) to separate distinct narratives and product categories.
*   **Product Displays:** Utilize asymmetrical layouts for editorial sections to mimic the feel of a curated catalog, while maintaining a strict, clean grid for the primary shop listing pages.

## Elevation & Depth

To maintain the "premium and authentic" vibe, depth is communicated through **Tonal Layering** and **Soft Ambient Shadows**.

*   **Surfaces:** Instead of harsh drop shadows, use subtle color shifts. For example, a card might be a slightly lighter cream (#FFFFFF) against the parchment neutral (#F9F6F0).
*   **Shadows:** When used (e.g., for floating "Add to Cart" buttons or modals), shadows should be very diffused, using a hint of the secondary brown in the shadow color (`rgba(139, 69, 19, 0.08)`) rather than pure black.
*   **Depth:** Components that are physically "higher" (like a product modal) should have a slightly warmer background tint to suggest they are closer to the light source.

## Shapes

The shape language is **Soft (0.25rem / 4px)**. 

While the products themselves (mates and gourds) are highly organic and round, the UI components remain relatively structured to provide a sense of stability and modern professionalism. Very slight rounding on buttons and cards removes the "sharpness" of digital interfaces without making the design feel overly playful or "bubbly."

*   **Buttons:** Soft edges (4px) to feel like cut leather.
*   **Images:** Product photos should always have the standard soft corner radius unless they are full-bleed sections.
*   **Input Fields:** Maintain the 4px radius for consistency and a "sturdy" architectural feel.

## Components

*   **Buttons:** 
    *   *Primary:* Solid Forest Green with white text. High contrast, authoritative.
    *   *Secondary:* Outlined in Wood Brown with matching text. 
    *   *Accent (CTA):* Solid Rustic Orange. Reserved for the final "Buy Now" or "Checkout" steps.
*   **Cards:** 
    *   Product cards should be borderless with a subtle parchment-to-white tonal lift. The typography within the card (Product Name) should use `headline-md` (Domine) for a premium feel.
*   **Inputs:** 
    *   Text fields use a thin 1px border in a muted brown-gray. Focus states should transition the border to the Primary Green.
*   **Chips/Badges:** 
    *   Use for "Handmade," "Organic," or "Limited Edition." These should have a light Wood Brown background with dark brown text, resembling a small leather tag.
*   **Lists:** 
    *   In checkout or product details, use subtle horizontal dividers in a very light beige. Avoid heavy black lines.
*   **Specialty Component (The Story Block):** 
    *   A recurring component that pairs a large serif quote with an image of the artisan. This reinforces the "Authentic" brand pillar.