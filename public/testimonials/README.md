# Testimonials Images

This folder contains profile pictures for testimonials shown on the landing page.

## Required Images:

### Players Testimonials:
1. **ahmed-khan.jpg** - Regular Player from Karachi
2. **hassan-ali.jpg** - Badminton Enthusiast from Lahore
3. **hamza-malik.jpg** - Cricket Team Captain from Islamabad

### Venue Owners Testimonials:
4. **faisal-ahmed.jpg** - Venue Owner of The Arena, Karachi
5. **usman-siddiqui.jpg** - Venue Owner of Sports Hub, Lahore

## Image Specifications:

- **Format:** JPG, PNG, or WebP
- **Recommended Size:** 200x200 pixels minimum (square)
- **Aspect Ratio:** 1:1 (square images work best)
- **File Size:** Keep under 500KB for optimal performance
- **Quality:** Use professional, high-quality headshots

## Tips:

- Use well-lit, professional-looking photos
- Ensure faces are clearly visible
- Center the face in the image
- Use neutral or professional backgrounds
- Images will be displayed as circular avatars (48x48px on the page)

## How to Add Images:

1. Place your images in this folder (`public/testimonials/`)
2. Name them exactly as listed above (case-sensitive on some systems)
3. The images will automatically appear on the landing page

## Using Your Own Names/Images:

If you want to use different people for testimonials, edit:
`src/components/landing/Testimonials.tsx`

Update the `testimonials` and `venueOwnerTestimonials` arrays with new names, roles, and image paths.
