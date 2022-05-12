import { useContext, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GlobalContext, INITIAL_TOKEN_STATE } from '../context/GlobalState';
import BigNumber from 'bignumber.js';
import useLiquidityPos from './useLiquidityPos';

// work around for being able to use useLocation globaly without a conditionaly rendered component

export default function useWatchLocation() {
  const {
    setLocation,
    token2,
    tokensCleared,
    accountId,
    showConfirmModal,
    setShowConfirmModal,
    setShowTxDone,
    lastTx,
    setToken1,
    token1,
    setToken2,
    location,
    setT2DIDResponse,
    importPool,
    setImportPool,
  } = useContext(GlobalContext);
  const currentLocation = useLocation();
  const lastLocation = useRef(currentLocation);

  useLiquidityPos(importPool, setImportPool);

  useEffect(() => {
    setLocation(currentLocation.pathname);
  }, [currentLocation]);

  useEffect(() => {
    if (currentLocation.pathname !== lastLocation.current.pathname) {
      tokensCleared.current = false;
    }

    if (currentLocation.pathname === '/trade') {
      if (!token1.info && !token2.info) {
        tokensCleared.current = true;
        lastLocation.current = currentLocation;
      }
    } else if (!token2.info) {
      tokensCleared.current = true;
      lastLocation.current = currentLocation;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocation.pathname, token1.info, token2.info, token1, token2]);

  const initialAccount = useRef(accountId);
  const navigate = useNavigate();
  useEffect(() => {
    if (
      initialAccount.current &&
      accountId !== initialAccount.current &&
      currentLocation.pathname === '/stake/remove'
    ) {
      navigate('/stake/list');
    }
    initialAccount.current = accountId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId]);

  useEffect(() => {
    if (lastTx && lastTx.status === 'Indexing' && lastTx.txType !== 'approve') {
      if (showConfirmModal) {
        setShowConfirmModal(false);
        setShowTxDone(true);
      }
      if (location === '/stake/remove') {
        setToken1({ ...token1, value: new BigNumber(0), percentage: new BigNumber(0) });
      } else if (location === '/trade' || location === '/stake') {
        setToken1(INITIAL_TOKEN_STATE);
        setToken2(INITIAL_TOKEN_STATE);
        setT2DIDResponse(undefined);
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastTx]);
}
