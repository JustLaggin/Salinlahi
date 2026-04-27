# Login Page CSS - Quick Reference Guide

## 🎯 Most Important CSS Rules

### Split-Layout Container
```css
.login-shell-wrapper {
  display: grid;
  grid-template-columns: 450px 1fr;  /* 40% form, 60% showcase */
  min-height: 100vh;
}

.login-form-column {
  display: flex;
  flex-direction: column;
  justify-content: center;  /* Vertically center form */
  padding: 3rem 2.5rem;
}

.login-showcase {
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, ...);
  border-left: 1px solid rgba(255, 255, 255, 0.08);
}
```

### Form Card
```css
.login-form-column .auth-card {
  background: rgba(20, 28, 43, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  padding: 2rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5),
              inset 0 1px 0 rgba(255, 255, 255, 0.05);
}
```

### Interactive Input Fields
```css
.login-form-column .input-field {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.5rem;
  background: rgba(30, 41, 59, 0.8);
  color: #f8fafc;
  transition: all 0.2s ease;
}

.login-form-column .input-field:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);  /* Glow effect */
}
```

### Gradient Button
```css
.login-form-column .btn-primary {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  padding: 1rem 1.5rem;
  font-weight: 600;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
  transition: all 0.2s ease;
}

.login-form-column .btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-2px);  /* Lift effect */
  box-shadow: 0 8px 16px rgba(16, 185, 129, 0.4);
}
```

### Error Alert Box
```css
.alert-error {
  background: rgba(220, 38, 38, 0.1);
  border: 1px solid rgba(220, 38, 38, 0.3);
  border-radius: 0.5rem;
  padding: 1rem;
  color: #fca5a5;
  display: flex;
  gap: 0.75rem;
}

.alert-error svg {
  color: #f87171;
  flex-shrink: 0;
}
```

### Password Toggle Button
```css
.password-toggle-btn {
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.password-toggle-btn:hover {
  color: #10b981;
  background-color: rgba(16, 185, 129, 0.1);
}
```

---

## 🎨 Color Palette

### Greens (Brand)
| Name | Value | Usage |
|------|-------|-------|
| Bright | `#10b981` | Accents, hover |
| Dark | `#059669` | Button pressed |
| Darkest | `#047857` | Darkest hover |
| Light | `#6ee7b7` | Text hover |

### Backgrounds
| Name | Value | Usage |
|------|-------|-------|
| Dark | `#0f172a` | Shell bg |
| Darker | `#1a1f3a` | Gradient middle |
| Card | `rgba(20, 28, 43, 0.95)` | Form card |
| Input | `rgba(30, 41, 59, 0.8)` | Input bg |

### Text
| Name | Value | Usage |
|------|-------|-------|
| White | `#f8fafc` | Primary text |
| Light | `#e2e8f0` | Secondary text |
| Medium | `#cbd5e1` | Tertiary text |
| Muted | `#94a3b8` | Placeholder |

### Errors
| Name | Value | Usage |
|------|-------|-------|
| Icon | `#f87171` | Error icon |
| Text | `#fca5a5` | Error text |
| BG | `rgba(220, 38, 38, 0.1)` | Alert bg |

---

## 📐 Responsive Breakpoints

### Desktop (>1024px)
- Split layout active
- Both panels visible
- Full spacing (3rem padding)

### Tablet (768px - 1023px)
```css
@media (max-width: 768px) {
  .login-shell-wrapper {
    grid-template-columns: 1fr;  /* Single column */
  }
  .login-showcase { display: none; }  /* Hide showcase */
}
```

### Mobile (<767px)
```css
@media (max-width: 480px) {
  .login-form-column { padding: 1.5rem 1rem; }  /* Reduced */
  .login-form-column .auth-title { font-size: 1.25rem; }  /* Smaller */
  .login-form-column .auth-card { padding: 1.25rem; }  /* Compact */
}
```

---

## ⚡ Performance Tips

### CSS Optimization
1. Use `transform` and `opacity` for animations (GPU accelerated)
2. Avoid `width`/`height` changes in hover states
3. Use `will-change` sparingly for heavy animations
4. Group media queries at end of file

### Best Practices
```css
/* ✅ Good - GPU accelerated */
transform: translateY(-2px);
opacity: 0.95;

/* ❌ Avoid - triggers reflow */
top: -8px;
padding: 12px 16px;
```

---

## 🔧 Customization Guide

### Change Primary Color
Replace all `#10b981` with your color:
```css
/* Search and replace */
#10b981  → Your color
#059669  → Darker shade
#047857  → Darkest shade
#6ee7b7  → Lighter shade
```

### Adjust Split Ratio
Modify grid columns:
```css
/* From 40/60 to 35/65 */
grid-template-columns: 400px 1fr;

/* From 40/60 to 50/50 */
grid-template-columns: 1fr 1fr;
```

### Change Border Radius
Replace all `border-radius` values:
```css
var(--radius-md): 0.5rem     → 0.375rem (more square)
var(--radius-lg): 0.75rem    → 1rem (more rounded)
```

### Adjust Spacing
Modify padding/margin:
```css
/* Compact layout */
padding: 2rem;  → padding: 1.5rem;

/* Spacious layout */
padding: 2rem;  → padding: 3rem;
```

---

## 🐛 Troubleshooting

### Issue: Focus ring not showing
**Solution**: Check that `outline: none` is applied and `box-shadow` has color
```css
.input-field:focus {
  outline: none;  /* Remove default outline */
  box-shadow: 0 0 0 3px rgba(...);  /* Add custom ring */
}
```

### Issue: Button not lifting on hover
**Solution**: Ensure selector specificity and media queries don't override
```css
/* Make sure this exists and isn't overridden */
.login-form-column .btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
}
```

### Issue: Mobile layout not responsive
**Solution**: Check viewport meta tag and test media query
```html
<!-- In HTML -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

### Issue: Gradient not visible
**Solution**: Check browser support; add fallback
```css
background: #10b981;  /* Fallback */
background: linear-gradient(135deg, #10b981 0%, #059669 100%);
```

---

## ✅ Testing Checklist

- [ ] Desktop (1920px) - All elements visible
- [ ] Tablet (768px) - Single column layout
- [ ] Mobile (375px) - Readable, touch-friendly
- [ ] Focus states - Tab through form
- [ ] Hover states - Mouse over buttons
- [ ] Error state - Show error message
- [ ] Loading state - Show spinner
- [ ] Disabled state - Inputs disabled
- [ ] Dark mode - Already dark theme
- [ ] High contrast - Text readable

---

## 📚 CSS Variables Used

From `index.css`:
```css
--space-2: 0.5rem
--space-3: 0.75rem
--space-4: 1rem
--space-5: 1.25rem
--space-6: 1.5rem
--space-8: 2rem
--space-10: 2.5rem
--space-12: 3rem
--radius-md: 0.5rem
--radius-lg: 0.75rem
```

From `auth.css` (custom):
```css
/* Green gradient colors */
#10b981  /* Primary green */
#059669  /* Dark green */
#047857  /* Darkest green */
#6ee7b7  /* Light green */

/* Background colors */
#0f172a  /* Dark base */
#1a1f3a  /* Gradient middle */
```

---

## 🚀 Deployment Notes

1. **No Breaking Changes**: All existing functionality preserved
2. **Backward Compatible**: Old class names still work
3. **Mobile Optimized**: Responsive on all devices
4. **Performance**: Minimal CSS overhead (~15KB)
5. **Browser Support**: Modern browsers (Chrome 76+, Firefox 63+, Safari 12+)

