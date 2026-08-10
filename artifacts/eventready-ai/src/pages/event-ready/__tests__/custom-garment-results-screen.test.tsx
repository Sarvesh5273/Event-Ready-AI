import React from 'react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CustomGarmentResultsScreen } from '../custom-garment-results-screen';
import type { EventReadyReport } from '@workspace/api-client-react';

// demoAssets.ts reads import.meta.env.BASE_URL at module scope; stub it out.
vi.mock('@/lib/demoAssets', () => ({
  resolveDemoAssetUrl: (url: string) => url,
}));

/** Minimal valid EventReadyReport with a custom garment attached. */
function makeReport(overrides: {
  userFacingReasons?: string[];
  userFacingCautions?: string[];
}): EventReadyReport {
  return {
    sessionId: 'test-session',
    mode: 'demo',
    flow: 'custom',
    recommendedCatalogItemId: '',
    skinSignals: {
      redness: 'unknown',
      oiliness: 'unknown',
      darkCircles: 'unknown',
      radiance: 'unknown',
      moisture: 'unknown',
      texture: 'unknown',
    },
    selectedOutfits: [],
    vtoResults: [],
    scores: [],
    prepTips: [],
    video: null,
    customGarment: {
      garmentCategory: 'upper_body',
      colorFamily: 'blue',
      undertone: 'cool',
      imageUrl: '/test-garment.jpg',
      vtoStatus: 'not_requested',
      vtoResultImageUrl: null,
      vtoErrorMessage: null,
      score: {
        confidenceScore: 72,
        reasonCodes: [],
        cautionCodes: [],
        userFacingReasons: overrides.userFacingReasons ?? [],
        userFacingCautions: overrides.userFacingCautions ?? [],
      },
    },
  } as EventReadyReport;
}

describe('CustomGarmentResultsScreen — skin-analysis-unavailable fallback', () => {
  it('shows the color-only fallback message when both reasons and cautions are empty', () => {
    render(
      <CustomGarmentResultsScreen
        report={makeReport({ userFacingReasons: [], userFacingCautions: [] })}
        onStartOver={vi.fn()}
      />,
    );

    expect(
      screen.getByTestId('custom-garment-skin-analysis-unavailable'),
    ).toBeInTheDocument();
  });

  it('does NOT show the fallback message when at least one reason is present', () => {
    render(
      <CustomGarmentResultsScreen
        report={makeReport({
          userFacingReasons: ['This color complements your complexion.'],
          userFacingCautions: [],
        })}
        onStartOver={vi.fn()}
      />,
    );

    expect(
      screen.queryByTestId('custom-garment-skin-analysis-unavailable'),
    ).not.toBeInTheDocument();
  });

  it('does NOT show the fallback message when at least one caution is present', () => {
    render(
      <CustomGarmentResultsScreen
        report={makeReport({
          userFacingReasons: [],
          userFacingCautions: ['This shade can clash with your undertone.'],
        })}
        onStartOver={vi.fn()}
      />,
    );

    expect(
      screen.queryByTestId('custom-garment-skin-analysis-unavailable'),
    ).not.toBeInTheDocument();
  });
});
