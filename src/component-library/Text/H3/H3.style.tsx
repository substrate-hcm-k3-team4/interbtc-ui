import styled from 'styled-components';

import { theme } from '../../theme';
import { TextProps } from '../types';
import { resolveTextColor } from '../utils';

const H3Text = styled.h3<TextProps>`
  color: ${({ color }) => resolveTextColor(color)};
  font-size: ${theme.text.xl3};
`;

export { H3Text };
