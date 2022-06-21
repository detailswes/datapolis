import React, { SetStateAction, useContext, useEffect } from 'react';
import { GlobalContext } from '../context/GlobalState';
import { IPoolMetaData, ITxDetails, ITxType } from '../utils/types';
import BigNumber from 'bignumber.js';

export default function useTxHandler(
  txFunction: Function,
  executeTx: boolean,
  setExecuteTx: React.Dispatch<SetStateAction<boolean>>,
  txDetails: { slippage?: BigNumber; postExchange?: BigNumber; shares?: BigNumber; pool?: IPoolMetaData },
  allowanceOverride?: BigNumber,
  txAmountOverride?: BigNumber
) {
  const {
    accountId,
    handleConnect,
    setPreTxDetails,
    tokenIn,
    tokenOut,
    setExecuteUnlock,
    setShowConfirmTxDetails,
    setShowUnlockTokenModal,
    txApproved,
    setBlurBG,
    setLastTx,
    preTxDetails,
    location,
    showUnlockTokenModal,
  } = useContext(GlobalContext);

  useEffect(() => {
    const allowanceNeeded = allowanceOverride ? allowanceOverride : tokenIn.allowance;
    const txAmount = txAmountOverride ? txAmountOverride : tokenIn.value;
    if (showUnlockTokenModal && allowanceNeeded?.lt(txAmount)) {
      setBlurBG(false);
      setShowUnlockTokenModal(false);
      txFunction(true);
    }
  }, [tokenIn.allowance]);

  useEffect(() => {
    if (!accountId && executeTx) {
      handleConnect();
      setExecuteTx(false);
      return;
    }

    const allowanceNeeded = allowanceOverride ? allowanceOverride : tokenIn.allowance;
    const txAmount = txAmountOverride ? txAmountOverride : tokenIn.value;

    if (accountId) {
      if (allowanceNeeded?.lt(txAmount)) {
        console.log("Token approval needed")
        setPreTxDetails({
          accountId,
          status: 'Pending',
          tokenIn,
          tokenOut,
          txDateId: Date.now().toString(),
          txType: 'approve',
          shares: txAmountOverride
        });
        setExecuteUnlock(true);
        setShowUnlockTokenModal(true);
        setBlurBG(true);
        setExecuteTx(false);
      } else if (!txApproved && executeTx) {
        console.log("TX confirmation needed")

        let txType: ITxType;
        switch (location) {
          case '/stake':
            txType = 'stake';
            break;
          case '/stake/remove':
            txType = 'unstake';
            break;
          default:
            txType = 'swap';
            break;
        }

        const preTxDetails: ITxDetails = {
          accountId,
          status: 'Pending',
          tokenIn,
          tokenOut,
          txDateId: Date.now().toString(),
          txType,
          ...txDetails,
        };
        setPreTxDetails(preTxDetails);
        setShowConfirmTxDetails(true);
        setBlurBG(true);
      } else if (executeTx && preTxDetails) {
        console.log("Executing TX");
        
        setLastTx(preTxDetails);
        txFunction(preTxDetails);
      }
    }
  }, [executeTx, txApproved]);
}
