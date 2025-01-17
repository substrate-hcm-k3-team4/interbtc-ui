import { useMeter } from '@react-aria/meter';
import { HTMLAttributes, ReactNode } from 'react';

import { Status } from '@/component-library/utils/prop-types';

import {
  StyledBar,
  StyledLabel,
  StyledLabelWrapper,
  StyledScore,
  StyledScoreWrapper,
  StyledSublabel,
  StyledWrapper
} from './CollateralScore.style';

type StatusRanges = Record<Status, { min: number; max: number }>;

const formatOptions: Intl.NumberFormatOptions = { style: 'decimal', maximumFractionDigits: 2 };

const getStatus = (value: number, ranges: StatusRanges): Status => {
  if (value <= ranges['error'].max) return 'error';
  if (value <= ranges['warning'].max) return 'warning';
  return 'success';
};

const getBarPercentage = (status: Status, value: number, ranges: StatusRanges): number => {
  // We need the percentage against each segment range and we get by
  // subtracting the start of segment from the current value
  const segmentValue = (value > ranges[status].max ? ranges[status].max : value) - ranges[status].min;

  // Same approach but now for the max value
  const segmentMaxValue = ranges[status].max - ranges[status].min;

  // We calculate against the percentage that each segment occupies from the parent
  switch (status) {
    case 'error':
      return (segmentValue / segmentMaxValue) * 25;
    case 'warning':
      // error + (current segment percentage)
      return 25 + (segmentValue / segmentMaxValue) * 50;
    case 'success':
      // error + warning + (current segment percentage)
      return 75 + (segmentValue / segmentMaxValue) * 25;
  }
};

type Props = {
  ranges: StatusRanges;
  variant?: 'default' | 'highlight';
  score?: number;
  label?: ReactNode;
  sublabel?: ReactNode;
};

type NativeAttrs = Omit<HTMLAttributes<unknown>, keyof Props>;

type CollateralScoreProps = Props & NativeAttrs;

const CollateralScore = ({
  score = 0,
  label,
  sublabel,
  variant = 'default',
  ranges,
  ...props
}: CollateralScoreProps): JSX.Element => {
  // Makes sure we always have the correct aria-valuemax
  const maxValue = score > ranges.success.max ? score : ranges.success.max;

  const { meterProps, labelProps } = useMeter({
    minValue: ranges.error.min,
    maxValue,
    value: score,
    formatOptions,
    label,
    ...props
  });

  // Does not allow negative numbers
  const value = meterProps['aria-valuenow'] || 0;
  const status = getStatus(value, ranges);
  const barPercentage = getBarPercentage(status, value, ranges);

  const isDefault = variant === 'default';

  return (
    <StyledWrapper {...meterProps} {...props}>
      <StyledLabelWrapper isDefault={isDefault}>
        <StyledLabel {...labelProps} isDefault={isDefault}>
          {label}
        </StyledLabel>
        <StyledScoreWrapper isDefault={isDefault}>
          <StyledScore isDefault={isDefault} status={status}>
            {meterProps['aria-valuetext']}%
          </StyledScore>
          <StyledSublabel isDefault={isDefault} status={isDefault ? status : undefined}>
            {sublabel}
          </StyledSublabel>
        </StyledScoreWrapper>
      </StyledLabelWrapper>
      <StyledBar width={barPercentage} />
    </StyledWrapper>
  );
};

export { CollateralScore };
export type { CollateralScoreProps };
