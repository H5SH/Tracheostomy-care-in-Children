/**
 * Shared UI primitives. Every screen is built from these so spacing, radii and the coral accent
 * stay consistent — see `theme.js` for the tokens.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useLanguage } from '../i18n/LanguageProvider';
import { colors, controlHeight, radius, shadow, spacing, type } from './theme';

/* -------------------------------------------------------------------------- */
/* Layout                                                                     */
/* -------------------------------------------------------------------------- */

/** Full-bleed mint background with the app's standard horizontal gutter. */
export function Screen({ children, style, gutter = true }) {
  return (
    <View
      style={[
        { flex: 1, backgroundColor: colors.canvas },
        gutter && { paddingHorizontal: spacing.lg },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** A soft mint circle used to give flat screens some depth without a gradient library. */
export function Blob({ size, color = colors.mint, style }) {
  return (
    <View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

/** Fades and lifts its children in on mount. Used for screen entrances. */
export function FadeInView({ children, delay = 0, distance = 14, style }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 420,
      delay,
      useNativeDriver: true,
    }).start();
  }, [progress, delay]);

  return (
    <Animated.View
      style={[
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [distance, 0],
              }),
            },
          ],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

/* -------------------------------------------------------------------------- */
/* Text                                                                       */
/* -------------------------------------------------------------------------- */

export function Eyebrow({ children, style }) {
  const { textStyle, isRTL } = useLanguage();
  // Urdu has no case distinction, so uppercasing and letter-spacing it would only hurt it.
  return (
    <Text
      style={[
        type.eyebrow,
        isRTL ? { letterSpacing: 0 } : { textTransform: 'uppercase' },
        textStyle,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

/** Screen title block: small label, large title, optional supporting line. */
export function PageHeading({ eyebrow, title, subtitle, style }) {
  const { textStyle } = useLanguage();
  return (
    <View style={style}>
      {!!eyebrow && <Eyebrow style={{ marginBottom: spacing.sm }}>{eyebrow}</Eyebrow>}
      <Text style={[type.display, textStyle]}>{title}</Text>
      {!!subtitle && (
        <Text style={[type.body, { marginTop: spacing.sm }, textStyle]}>{subtitle}</Text>
      )}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Buttons                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * `variant="primary"` is the coral fill — at most one per screen.
 * `variant="secondary"` is an outlined mint button for everything else.
 */
export function AppButton({
  label,
  onPress,
  icon,
  variant = 'primary',
  style,
}) {
  const primary = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          height: controlHeight.button,
          paddingHorizontal: spacing.xl,
          borderRadius: radius.pill,
          backgroundColor: primary
            ? pressed
              ? colors.accentDeep
              : colors.accent
            : pressed
              ? colors.mint
              : colors.surface,
          borderWidth: primary ? 0 : 1.5,
          borderColor: colors.border,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        primary ? shadow(2) : shadow(1),
        style,
      ]}
    >
      <Text style={[type.button, { color: primary ? colors.surface : colors.ink }]}>
        {label}
      </Text>
      {!!icon && (
        <Ionicons name={icon} size={19} color={primary ? colors.surface : colors.accent} />
      )}
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/* Language switcher                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Both states of the switcher are one row of these circles, so the control's height is the same
 * open or closed and the call to action below it never moves.
 *
 * 48 rather than `controlHeight.pill`: that token sizes a control around a text label, and a
 * circle needs to clear the 48dp Android minimum touch target in both axes.
 */
const LANGUAGE_CIRCLE = 48;
const LANGUAGE_GAP = spacing.sm;

/** One circle: a two-letter code, a `+N` count, or an icon. */
function LanguageCircle({ label, icon, selected, muted, onPress, accessibilityLabel }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected: Boolean(selected) }}
      style={({ pressed }) => [
        {
          width: LANGUAGE_CIRCLE,
          height: LANGUAGE_CIRCLE,
          borderRadius: LANGUAGE_CIRCLE / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: selected ? colors.accent : muted ? colors.mint : colors.surface,
          borderWidth: 1.5,
          borderColor: selected ? colors.accent : colors.border,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.94 : 1 }],
        },
        selected ? shadow(1) : null,
      ]}
    >
      {icon ? (
        <Ionicons name={icon} size={20} color={selected ? colors.surface : colors.accentDeep} />
      ) : (
        <Text
          style={{
            fontSize: 14,
            fontWeight: '700',
            letterSpacing: 0.3,
            color: selected ? colors.surface : muted ? colors.accentDeep : colors.ink,
          }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

/**
 * Collapsed, two circles: the language in use and a `+N` opening the rest. Expanded, a close
 * button and a horizontally scrollable strip of every language. Picking one switches the app
 * immediately and collapses back.
 *
 * The strip itself always reads left-to-right, even in Urdu — the codes are Latin (`EN`, `UR`,
 * `AR`), so mirroring the order would make a long list harder to scan, not easier. The row
 * around it still mirrors, which is why the close button sits on the trailing edge in Urdu.
 */
export function LanguageSwitcher() {
  const { languages, languageKey, setLanguage, rowDirection, t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const scrollRef = useRef(null);
  const fade = useRef(new Animated.Value(1)).current;

  // Cross-fades the two states. Height is identical either way, so only opacity moves.
  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }).start();
  }, [expanded, fade]);

  // Open the strip on the language in use rather than at its start — once there are twenty-odd
  // languages the selected one would otherwise be somewhere off-screen.
  useEffect(() => {
    if (!expanded) return undefined;

    const index = languages.findIndex((language) => language.key === languageKey);
    if (index < 1) return undefined;

    const offset = index * (LANGUAGE_CIRCLE + LANGUAGE_GAP) - LANGUAGE_CIRCLE;
    const frame = requestAnimationFrame(() =>
      scrollRef.current?.scrollTo({ x: Math.max(0, offset), animated: false })
    );
    return () => cancelAnimationFrame(frame);
  }, [expanded, languageKey, languages]);

  const current = languages.find((language) => language.key === languageKey) ?? languages[0];
  const otherCount = languages.length - 1;

  return (
    <Animated.View
      style={{
        flexDirection: rowDirection,
        alignItems: 'center',
        gap: LANGUAGE_GAP,
        height: LANGUAGE_CIRCLE,
        opacity: fade,
      }}
    >
      {expanded ? (
        <>
          <LanguageCircle
            icon="close"
            muted
            onPress={() => setExpanded(false)}
            accessibilityLabel={t('language.close')}
          />
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: LANGUAGE_GAP,
              paddingRight: spacing.lg,
            }}
          >
            {languages.map((language) => (
              <LanguageCircle
                key={language.key}
                label={language.code}
                selected={language.key === languageKey}
                accessibilityLabel={language.label}
                onPress={() => {
                  setLanguage(language.key);
                  setExpanded(false);
                }}
              />
            ))}
          </ScrollView>
        </>
      ) : (
        <>
          <LanguageCircle
            label={current.code}
            selected
            accessibilityLabel={current.label}
            onPress={() => setExpanded(true)}
          />
          {otherCount > 0 && (
            <LanguageCircle
              label={`+${otherCount}`}
              muted
              onPress={() => setExpanded(true)}
              accessibilityLabel={t('language.more', { count: otherCount })}
            />
          )}
        </>
      )}
    </Animated.View>
  );
}

/* -------------------------------------------------------------------------- */
/* Cards                                                                      */
/* -------------------------------------------------------------------------- */

export function Card({ children, style, level = 1 }) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
        },
        shadow(level),
        style,
      ]}
    >
      {children}
    </View>
  );
}

/**
 * A procedure in the list: thumbnail, full title (it wraps rather than truncating — several of
 * these names are long and the old single-line card cut them off), and a coral play affordance.
 */
export function ProcedureCard({ title, image, caption, onPress }) {
  const { textStyle, rowDirection, isRTL } = useLanguage();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [
        {
          flexDirection: rowDirection,
          alignItems: 'center',
          gap: spacing.base,
          padding: spacing.md,
          backgroundColor: pressed ? colors.mint : colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
        shadow(1),
      ]}
    >
      <View
        style={{
          width: 78,
          height: 78,
          borderRadius: radius.md,
          backgroundColor: colors.mint,
          overflow: 'hidden',
        }}
      >
        <Image source={image} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[type.heading, { marginBottom: 5 }, textStyle]}>{title}</Text>
        <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: 5 }}>
          <Ionicons name="play-circle" size={15} color={colors.accent} />
          <Text style={[type.caption, { color: colors.accentDeep }]}>{caption}</Text>
        </View>
      </View>

      <Ionicons
        name={isRTL ? 'chevron-back' : 'chevron-forward'}
        size={20}
        color={colors.inkFaint}
      />
    </Pressable>
  );
}

/** A single fact with an icon — used for the highlights on the welcome screen. */
export function FeatureRow({ icon, label }) {
  const { textStyle, rowDirection } = useLanguage();
  return (
    <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: spacing.md }}>
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: radius.sm,
          backgroundColor: colors.accentSoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={17} color={colors.accent} />
      </View>
      <Text style={[type.body, { color: colors.ink, flex: 1 }, textStyle]}>{label}</Text>
    </View>
  );
}
