# Guide Responsive et UX - Fadju Web

## Vue d'ensemble

Ce guide présente les optimisations responsive et UX implémentées dans la plateforme Fadju Web pour garantir une expérience utilisateur optimale sur tous les appareils.

## Breakpoints Tailwind CSS

```css
sm: 640px   /* Tablettes portrait */
md: 768px   /* Tablettes paysage */
lg: 1024px  /* Desktop */
xl: 1280px  /* Grands écrans */
2xl: 1536px /* Très grands écrans */
```

## Composants Responsive

### 1. Layout Principal (DashboardLayout)

**Fonctionnalités :**
- Sidebar rétractable sur mobile avec overlay
- Padding adaptatif (`p-4 sm:p-6`)
- Animations Framer Motion optimisées
- Support du mode sombre/clair

**Mobile :**
- Sidebar en full-screen overlay
- Navigation par hamburger menu
- Transitions fluides avec spring physics

### 2. Grilles Adaptatives

```tsx
// Grid responsive automatique
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
```

**Patterns utilisés :**
- **Mobile (base):** 1 colonne
- **Tablette (sm):** 2 colonnes
- **Desktop (lg+):** 4 colonnes

### 3. Cards Statistiques

**Optimisations mobiles :**
- Tailles d'icônes adaptatives (`h-8 w-8 lg:h-10 lg:w-10`)
- Texte responsive (`text-xs lg:text-sm`)
- Padding conditionnel (`p-4 lg:p-6`)
- Effets hover désactivés sur mobile

### 4. Navigation (Sidebar)

**Améliorations mobiles :**
- Largeur maximale responsive (`max-w-[85vw] sm:max-w-[320px]`)
- Z-index optimisé pour mobile/desktop
- Animations spring avec damping adapté
- Fermeture automatique au clic sur lien

## Composants UX Avancés

### 1. Loading Skeletons

```tsx
import { StatsSkeleton, CardSkeleton, TableSkeleton } from '@/components/ui';

// États de chargement élégants
<StatsSkeleton count={4} />
<CardSkeleton showIcon lines={3} />
<TableSkeleton rows={5} columns={4} />
```

### 2. Optimisations Mobile

```tsx
import { 
  useIsMobile, 
  ResponsiveContainer, 
  ResponsiveGrid,
  BottomSheet,
  Touchable 
} from '@/components/ui';

// Détection mobile
const isMobile = useIsMobile();

// Container adaptatif
<ResponsiveContainer size="lg">
  <ResponsiveGrid cols={{ base: 1, sm: 2, lg: 4 }}>
    {/* Contenu */}
  </ResponsiveGrid>
</ResponsiveContainer>

// Modal mobile en bottom sheet
<BottomSheet isOpen={isOpen} onClose={onClose} title="Options">
  {/* Contenu */}
</BottomSheet>
```

### 3. Micro-interactions

```tsx
import { useMicroInteractions } from '@/hooks';

const { buttonInteractions, cardInteractions } = useMicroInteractions();

// Animations conditionnelles selon préférences système
<motion.button {...buttonInteractions}>
  Cliquez-moi
</motion.button>
```

## Animations et Performance

### 1. Système d'Animations

**Keyframes personnalisées :**
```css
@keyframes slideInFromLeft {
  0% { transform: translateX(-10px); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}
```

**Classes utilitaires :**
- `animate-fadeIn`
- `animate-slideInFromLeft`
- `animate-slideInFromRight`
- `animate-pulse`
- `animate-bounce`

### 2. Préférences d'Animation

```tsx
import { useAnimationPreferences } from '@/hooks';

const { 
  preferences, 
  getAnimationDuration, 
  getTransition,
  getAnimationVariants 
} = useAnimationPreferences();

// Respect des préférences système (prefers-reduced-motion)
const variants = getAnimationVariants();
```

### 3. Animations Staggerées

```tsx
import { useStaggerAnimation } from '@/hooks';

const staggerVariants = useStaggerAnimation(items.length, 0.1);

<motion.div variants={staggerVariants.container} initial="initial" animate="animate">
  {items.map((item, i) => (
    <motion.div key={i} variants={staggerVariants.item}>
      {item}
    </motion.div>
  ))}
</motion.div>
```

## Guidelines de Développement

### 1. Mobile-First

**Toujours commencer par le mobile :**
```tsx
// ✅ Correct
className="text-sm md:text-base lg:text-lg"

// ❌ Incorrect
className="lg:text-lg md:text-base text-sm"
```

### 2. Touch Targets

**Tailles minimales recommandées :**
- Boutons : 44px × 44px minimum
- Liens : 32px × 32px minimum
- Zones cliquables : 48px × 48px recommandé

```tsx
// Touch-friendly button
<button className="min-h-[44px] min-w-[44px] touch-manipulation">
```

### 3. Safe Areas

```tsx
// Support des encoches iPhone/Android
<SafeArea className="min-h-screen">
  <App />
</SafeArea>
```

### 4. Performance

**Lazy Loading des composants lourds :**
```tsx
const HeavyComponent = lazy(() => import('./HeavyComponent'));

<Suspense fallback={<CardSkeleton />}>
  <HeavyComponent />
</Suspense>
```

## Patterns de Design

### 1. Cards Responsives

```tsx
<Card className="hover:shadow-lg transition-all duration-200">
  <CardContent className="p-4 lg:p-6">
    <div className="flex items-center justify-between">
      <div className="min-w-0 flex-1">
        <ResponsiveText variant="caption">Label</ResponsiveText>
        <ResponsiveText variant="h4">Valeur</ResponsiveText>
      </div>
      <div className="h-8 w-8 lg:h-10 lg:w-10 bg-primary rounded-lg flex items-center justify-center ml-3">
        <Icon className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
      </div>
    </div>
  </CardContent>
</Card>
```

### 2. Formulaires Mobiles

```tsx
// Stack vertical avec espacement adaptatif
<Stack spacing={4}>
  <Input label="Email" type="email" />
  <Input label="Mot de passe" type="password" />
  
  {/* Bouton pleine largeur sur mobile */}
  <Button className="w-full sm:w-auto" variant="primary">
    Se connecter
  </Button>
</Stack>
```

### 3. Navigation Responsive

```tsx
// Burger menu visible seulement sur mobile
<Button 
  variant="ghost" 
  className="lg:hidden"
  onClick={toggleSidebar}
>
  <Menu className="h-6 w-6" />
</Button>
```

## Tests et Validation

### 1. Breakpoints à Tester

- **Mobile :** 375px (iPhone SE), 414px (iPhone 12)
- **Tablette :** 768px (iPad), 1024px (iPad Pro)
- **Desktop :** 1280px, 1440px, 1920px

### 2. Checklist UX Mobile

- [ ] Navigation accessible avec une main
- [ ] Boutons assez grands pour le touch
- [ ] Contenu lisible sans zoom
- [ ] Animations fluides (60fps)
- [ ] Temps de chargement < 3s
- [ ] Respect des préférences système
- [ ] Support mode sombre/clair
- [ ] Gestion des états de chargement

### 3. Outils de Test

```bash
# Test responsive avec différentes tailles
npm run dev
# Ouvrir DevTools > Toggle device toolbar (Ctrl+Shift+M)

# Test performance
npm run build
npm run start
# Lighthouse audit
```

## Bonnes Pratiques

### 1. Accessibilité

```tsx
// Focus visible
className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"

// Labels explicites
<Input 
  label="Email professionnel"
  placeholder="exemple@etablissement.sn"
  aria-describedby="email-help"
/>
```

### 2. Performance

```tsx
// Lazy loading des images
<Image
  src="/image.jpg"
  alt="Description"
  loading="lazy"
  className="object-cover"
/>

// Préchargement des routes critiques
const router = useRouter();
useEffect(() => {
  router.prefetch('/dashboard');
}, []);
```

### 3. Maintenance

```tsx
// Composants réutilisables
const StatsCard = ({ icon, label, value, color }) => (
  <Card hover>
    <CardContent className="p-4 lg:p-6">
      {/* Structure standardisée */}
    </CardContent>
  </Card>
);
```

## Prochaines Améliorations

1. **PWA Support :** Service worker, install prompt
2. **Offline Mode :** Cache local avec sync
3. **Haptic Feedback :** Vibrations sur mobile
4. **Voice Commands :** Recherche vocale
5. **Gesture Navigation :** Swipe actions
6. **Dark Mode Scheduling :** Auto selon l'heure
7. **Performance Monitoring :** Core Web Vitals
8. **A/B Testing :** Variants d'interface

Cette architecture responsive garantit une expérience utilisateur cohérente et optimisée sur tous les appareils, tout en respectant les standards d'accessibilité et de performance moderne.