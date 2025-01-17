import { Meta, Story } from '@storybook/react';

import { formatUSD } from '@/common/utils/utils';

import { TokenField, TokenFieldProps } from '.';

const Template: Story<TokenFieldProps> = (args) => <TokenField {...args} />;

const WithBalance = Template.bind({});
WithBalance.args = {
  tokenSymbol: 'KSM',
  valueInUSD: formatUSD(100.00),
  defaultValue: 100.0, // `value`
  balance: {
    value: '1000.00',
    valueInUSD: formatUSD(1000.00)
  }
};

const WithoutBalance = Template.bind({});
WithoutBalance.args = {
  tokenSymbol: 'KSM',
  valueInUSD: formatUSD(100.00),
  defaultValue: 100.0 // `value`
};

export { WithBalance, WithoutBalance };

export default {
  title: 'Forms/TokenField',
  component: TokenField
} as Meta;
