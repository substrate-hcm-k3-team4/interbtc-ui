import * as React from 'react';
import { toast } from 'react-toastify';
import {
  useSelector,
  useDispatch
} from 'react-redux';
import {
  useErrorHandler,
  withErrorBoundary
} from 'react-error-boundary';
import { useTranslation } from 'react-i18next';
import Big from 'big.js';
import clsx from 'clsx';
import { FaExclamationCircle } from 'react-icons/fa';

import RequestWrapper from 'pages/Home/RequestWrapper';
import InterlayDenimOutlinedButton from 'components/buttons/InterlayDenimOutlinedButton';
import InterlayConiferOutlinedButton from 'components/buttons/InterlayConiferOutlinedButton';
import ErrorFallback from 'components/ErrorFallback';
import { getUsdAmount } from 'common/utils/utils';
import STATUSES from 'utils/constants/statuses';
import { StoreType } from 'common/types/util.types';
import {
  retryRedeemRequestAction,
  reimburseRedeemRequestAction
} from 'common/actions/redeem.actions';
import { Redeem } from '@interlay/interbtc';
import { BTCAmount, Polkadot, PolkadotAmount } from '@interlay/monetary-js';

interface Props {
  request: Redeem | undefined;
  onClose: () => void;
}

const ReimburseStatusUI = ({
  request,
  onClose
}: Props): JSX.Element => {
  const {
    polkaBtcLoaded,
    prices
  } = useSelector((state: StoreType) => state.general);
  const [burnStatus, setBurnStatus] = React.useState(STATUSES.IDLE);
  const [retryStatus, setRetryStatus] = React.useState(STATUSES.IDLE);
  const [punishmentDOT, setPunishmentDOT] = React.useState(PolkadotAmount.zero);
  const [dotAmount, setDOTAmount] = React.useState(PolkadotAmount.zero);
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const handleError = useErrorHandler();

  React.useEffect(() => {
    if (!polkaBtcLoaded) return;
    if (!request) return;
    if (!handleError) return;

    // TODO: should add loading UX
    (async () => {
      try {
        const [
          punishment,
          btcDotRate
        ] = await Promise.all([
          window.polkaBTC.vaults.getPunishmentFee(),
          window.polkaBTC.oracle.getExchangeRate(Polkadot)
        ]);
        const amountPolkaBTC = request ? BTCAmount.from.BTC(request.amountBTC) : BTCAmount.zero;
        setDOTAmount(btcDotRate.toCounter(amountPolkaBTC));
        setPunishmentDOT(btcDotRate.toCounter(amountPolkaBTC).mul(new Big(punishment)));
      } catch (error) {
        handleError(error);
      }
    })();
  }, [
    request,
    polkaBtcLoaded,
    handleError
  ]);

  const handleRetry = async () => {
    if (!polkaBtcLoaded) {
      throw new Error('InterBTC is not loaded!');
    }
    if (!request) {
      throw new Error('Invalid request!');
    }

    try {
      setRetryStatus(STATUSES.PENDING);
      await window.polkaBTC.redeem.cancel(request.id, false);
      dispatch(retryRedeemRequestAction(request.id));
      onClose();
      toast.success(t('redeem_page.successfully_cancelled_redeem'));
      setRetryStatus(STATUSES.RESOLVED);
    } catch (error) {
      // TODO: should add error handling UX
      setRetryStatus(STATUSES.REJECTED);
      console.log('[handleRetry] error => ', error);
    }
  };

  const handleBurn = async () => {
    if (!polkaBtcLoaded) {
      throw new Error('InterBTC is not loaded!');
    }
    if (!request) {
      throw new Error('Invalid request!');
    }

    try {
      setBurnStatus(STATUSES.PENDING);
      await window.polkaBTC.redeem.cancel(request.id, true);
      dispatch(reimburseRedeemRequestAction(request.id));
      onClose();
      toast.success(t('redeem_page.successfully_cancelled_redeem'));
      setBurnStatus(STATUSES.RESOLVED);
    } catch (error) {
      // TODO: should add error handling UX
      setBurnStatus(STATUSES.REJECTED);
      console.log('[handleBurn] error => ', error);
    }
  };

  return (
    <RequestWrapper
      id='ReimburseStatusUI'
      className='lg:px-12'>
      <div className='space-y-1'>
        <h2
          className={clsx(
            'text-lg',
            'font-medium',
            'text-interlayCalifornia',
            'flex',
            'justify-center',
            'items-center',
            'space-x-1'
          )}>
          <FaExclamationCircle />
          <span>
            {t('redeem_page.sorry_redeem_failed')}
          </span>
        </h2>
        <p
          className={clsx(
            'text-textSecondary',
            'text-justify'
          )}>
          <span>{t('redeem_page.vault_did_not_send')}</span>
          <span className='text-interlayDenim'>
            &nbsp;{punishmentDOT.toHuman()} DOT
          </span>
          <span>&nbsp;{`(≈ $ ${getUsdAmount(punishmentDOT, prices.polkadot.usd)})`}</span>
          <span>&nbsp;{t('redeem_page.compensation')}</span>
          .
        </p>
      </div>
      <div className='space-y-2'>
        <h5 className='font-medium'>
          {t('redeem_page.to_redeem_interbtc')}
        </h5>
        <ul
          className={clsx(
            'space-y-3',
            'ml-6',
            'text-textSecondary'
          )}>
          <li className='list-decimal'>
            <p className='text-justify'>
              <span>{t('redeem_page.receive_compensation')}</span>
              <span className='text-interlayDenim'>&nbsp;{punishmentDOT.toHuman()} DOT</span>
              <span>
                &nbsp;
                {t('redeem_page.retry_with_another', {
                  compensationPrice: getUsdAmount(punishmentDOT, prices.polkadot.usd)
                })}
              </span>
              .
            </p>
            <InterlayConiferOutlinedButton
              className='w-full'
              disabled={retryStatus !== STATUSES.IDLE || burnStatus !== STATUSES.IDLE}
              pending={retryStatus === STATUSES.PENDING}
              onClick={handleRetry}>
              {t('retry')}
            </InterlayConiferOutlinedButton>
          </li>
          <li className='list-decimal'>
            <p className='text-justify'>
              <span>{t('redeem_page.burn_interbtc')}</span>
              <span className='text-interlayDenim'>&nbsp;{dotAmount.toHuman()} DOT</span>
              <span>
                &nbsp;
                {t('redeem_page.with_added', {
                  amountPrice: getUsdAmount(dotAmount, prices.polkadot.usd)
                })}
              </span>
              <span className='text-interlayDenim'>&nbsp;{punishmentDOT.toHuman()} DOT</span>
              <span>
                &nbsp;
                {t('redeem_page.as_compensation_instead', {
                  compensationPrice: getUsdAmount(punishmentDOT, prices.polkadot.usd)
                })}
              </span>
            </p>
            <InterlayDenimOutlinedButton
              className='w-full'
              disabled={retryStatus !== STATUSES.IDLE || burnStatus !== STATUSES.IDLE}
              pending={burnStatus === STATUSES.PENDING}
              onClick={handleBurn}>
              {t('redeem_page.reimburse')}
            </InterlayDenimOutlinedButton>
          </li>
        </ul>
      </div>
    </RequestWrapper>
  );
};

export default withErrorBoundary(ReimburseStatusUI, {
  FallbackComponent: ErrorFallback,
  onReset: () => {
    window.location.reload();
  }
});