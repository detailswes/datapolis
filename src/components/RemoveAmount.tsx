import React, { useContext, useEffect, useState } from "react";
import { BsArrowDown } from "react-icons/bs";
import { useLocation } from "react-router";
import { Link } from "react-router-dom";
import { GlobalContext, PoolData } from "../context/GlobalState";
import { useTokenList } from "../utils/useTokenList";
import Button from "./Button";
import ConfirmModal from "./ConfirmModal";
import TransactionDoneModal from "./TransactionDoneModal";
import UserMessageModal from "./UserMessageModal";
import { toFixed } from "../utils/equate";
import getAllStakedPools, {
  getLocalPoolData,
  setLocalStorage,
} from "../utils/getAllStakedPools";

interface RecieveAmounts {
  dtAmount: string;
  oceanAmount: string;
}

const RemoveAmount = () => {
  const {
    allStakedPools,
    chainId,
    accountId,
    currentStakePool,
    setCurrentStakePool,
    setAllStakedPools,
    setLoading,
    loading,
    ocean,
  } = useContext(GlobalContext);
  const [noWallet, setNoWallet] = useState<boolean>(false);
  const [removePercent, setRemovePercent] = useState<string>("");
  const [recieveAmounts, setRecieveAmounts] = useState<RecieveAmounts>({
    dtAmount: "0",
    oceanAmount: "0",
  });
  const [removeAmount, setRemoveAmount] = useState<string>("0");
  const [showConfirmLoader, setShowConfirmLoader] = useState(false);
  const [showTxDone, setShowTxDone] = useState(false);
  const [recentTxHash, setRecentTxHash] = useState("");

  const [noStakedPools, setNoStakedPools] = useState<boolean>(false);
  const location = useLocation();
  useTokenList(chainId);

  useEffect(() => {
    setLoading(true);
    const queryParams = new URLSearchParams(location.search);
    const poolAddress = queryParams.get("pool");

    if (accountId) {
      const localStoragePoolData = getLocalPoolData(accountId);
      if (localStoragePoolData) {
        setAllStakedPools(JSON.parse(localStoragePoolData));
        setCurrentStakePool(
          JSON.parse(localStoragePoolData).find(
            (pool: { address: string }) => pool.address === poolAddress
          )
        );
        setLoading(false);
      }
    }

    if (!currentStakePool && !allStakedPools && ocean && accountId) {
      getAllStakedPools(accountId, ocean)
        .then(async (res) => {
          const settledArr = await Promise.allSettled(res);
          const allStakedPools = settledArr.map(
            (promise: PromiseSettledResult<PoolData>) => {
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              return promise.value;
            }
          );
          if (
            allStakedPools.length > 0 &&
            accountId === allStakedPools[0].accountId
          ) {
            setAllStakedPools(allStakedPools);
            setLocalStorage(allStakedPools);
          } else if (allStakedPools.length === 0) {
            setNoStakedPools(true);
          }
          setLoading(false);
        })
        .catch((e) => {
          console.error(e);
        });

      if (allStakedPools) {
        setCurrentStakePool(
          allStakedPools.find(
            (pool: { address: string }) => pool.address === poolAddress
          )
        );
      }
    }
  }, [chainId, accountId]);

  useEffect(() => {
    console.log("current pool", currentStakePool);
    accountId ? setNoWallet(false) : setNoWallet(true);
  }, [accountId, chainId, removeAmount]);

  const updateNum = (val: string) => {
    const numberAmt = Number(val);
    if (numberAmt <= 100) {
      let b = val;
      let c = val;
      c =
        b.indexOf(".") >= 0
          ? b.substr(0, b.indexOf(".")) + b.substr(b.indexOf("."), 3)
          : b;
      setRemovePercent(String(c));
      if (numberAmt >= 100) setRemovePercent("100");
      if (numberAmt <= 0) setRemovePercent("");
      if (numberAmt > 0 && numberAmt <= 100) {
        const sharesToRemove = currentStakePool.shares * (numberAmt / 100);
        setRemoveAmount(String(sharesToRemove));
        ocean
          .getTokensRemovedforPoolShares(
            currentStakePool.address,
            sharesToRemove
          )
          .then((res: RecieveAmounts) => {
            let { dtAmount, oceanAmount } = res;
            dtAmount = toFixed(dtAmount);
            oceanAmount = toFixed(oceanAmount);
            setRecieveAmounts({ dtAmount, oceanAmount });
          })
          .catch(console.error);
      } else {
        setRecieveAmounts({ dtAmount: "0", oceanAmount: "0" });
      }
    }
  };

  const handleWithdrawal = async () => {
    try {
      setShowConfirmLoader(true);
      console.log(`unstaking ${removeAmount} shares`);
      console.log(
        accountId,
        currentStakePool.address,
        removeAmount,
        currentStakePool.totalPoolShares
      );
      const txReceipt = await ocean.unstakeOcean(
        accountId,
        currentStakePool.address,
        recieveAmounts.oceanAmount,
        currentStakePool.shares
      );
      setRecentTxHash(
        ocean.config.default.explorerUri + "/tx/" + txReceipt.transactionHash
      );
      setShowConfirmLoader(false);
      setShowTxDone(true);
    } catch (error) {
      console.error(error);
      setShowConfirmLoader(false);
    }
  };

  return noWallet ? (
    UserMessageModal({
      message: "Connect your wallet to continue.",
      pulse: false,
      container: true,
      timeout: null,
    })
  ) : noStakedPools ? (
    UserMessageModal({
      message: `You have no stake in any pools, check out StakeX to buy stake!`,
      pulse: false,
      container: true,
      timeout: null,
    })
  ) : (
    <>
      <div className="flex mt-16 w-full items-center mb-20">
        <div className="max-w-2xl mx-auto w-full">
          <div className="max-w-2xl mx-auto bg-primary-900 w-full rounded-lg p-4 hm-box">
            <div className="flex flex-row pb-2 justify-between">
              <div className="flex flex-row">
                <img
                  src="https://gateway.pinata.cloud/ipfs/QmPQ13zfryc9ERuJVj7pvjCfnqJ45Km4LE5oPcFvS1SMDg/datatoken.png"
                  className="rounded-lg mr-2"
                  alt=""
                  width="40px"
                />
                <img
                  src="https://gateway.pinata.cloud/ipfs/QmY22NH4w9ErikFyhMXj9uBHn2EnuKtDptTnb7wV6pDsaY"
                  className="rounded-lg mr-2"
                  alt=""
                  width="40px"
                />
                <p className="text-type-100 text-sm md:text-lg">{`${currentStakePool?.token1.symbol}/${currentStakePool?.token2.symbol}`}</p>
              </div>
              {loading
                ? UserMessageModal({
                    message: "Loading your token",
                    pulse: true,
                    container: false,
                    timeout: null,
                  })
                : null}
            </div>
            <div className="md:grid md:grid-cols-5 bg-primary-800 p-4 rounded">
              <div className="col-span-2 grid grid-flow-col gap-4 justify-start items-center">
                <p className="text-type-100">Amount to remove</p>
              </div>
              <div className="col-span-3 flex justify-end mt-3 md:mt-0 bg-primary-900 rounded-lg p-2">
                <div>
                  {/* https://stackoverflow.com/a/58097342/6513036 and https://stackoverflow.com/a/62275278/6513036 */}
                  <input
                    step="1"
                    onChange={(e) => updateNum(e.target.value)}
                    onWheel={(event) => event.currentTarget.blur()}
                    onKeyDown={(evt) =>
                      ["e", "E", "+", "-"].includes(evt.key) &&
                      evt.preventDefault()
                    }
                    type="number"
                    className="h-full w-full rounded-lg bg-primary-900 text-2xl px-2 outline-none focus:placeholder-type-200 placeholder-type-400 text-right"
                    placeholder="0.00"
                    value={removePercent}
                  />
                </div>
                <p className="text-type-300 text-2xl">%</p>
              </div>
            </div>
            <div className="px-4 relative my-12">
              <div className="rounded-full border-primary-900 border-4 absolute -top-14 bg-primary-800 w-16 h-16 flex items-center justify-center swap-center">
                <BsArrowDown size="30" className="text-gray-300" />
              </div>
            </div>
            <div className="bg-primary-800 p-4 rounded">
              <div className="md:grid md:grid-cols-5 bg-primary-800 p-4">
                <div className="col-span-2">
                  <p className="text-type-100">You will receive</p>
                </div>
                <div className="col-span-3 grid grid-cols-2 gap-4">
                  <div className="bg-primary-900 grid grid-flow-col gap-2 p-2 rounded-lg">
                    <div>
                      <img
                        src="https://gateway.pinata.cloud/ipfs/QmY22NH4w9ErikFyhMXj9uBHn2EnuKtDptTnb7wV6pDsaY"
                        className="w-12 rounded-lg"
                        alt=""
                      />
                    </div>
                    <div>
                      <p className="text-type-100">
                        {recieveAmounts.oceanAmount || 0}
                      </p>
                      <p className="text-xs text-type-100">
                        {currentStakePool?.token2.symbol}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex mt-4">
              {/* <div className="bg-gradient"></div> */}
              <Button
                text={"Approve and withdrawal"}
                onClick={handleWithdrawal}
                classes={`px-4 py-4 rounded-lg w-full ${
                  Number(removeAmount) > 0
                    ? "bg-primary-100 bg-opacity-20 hover:bg-opacity-40 text-background-800"
                    : "bg-gray-800 text-gray-400 cursor-not-allowed"
                }`}
                disabled={(Number(removeAmount) > 0? false:true)}
              />
            </div>
          </div>
          <div className="pt-3 pl-3">
            <Link
              to="/stakeX/list"
              className="text-gray-300 hover:text-gray-100 transition-colors"
            >
              {"<"} Back to liquidity position
            </Link>
          </div>
        </div>
      </div>

      <ConfirmModal
        show={showConfirmLoader}
        close={() => setShowConfirmLoader(false)}
        txs={
          currentStakePool
            ? [
                `Approve DataX to unstake ${toFixed(
                  recieveAmounts.oceanAmount
                )} OCEAN from the ${
                  currentStakePool.token1.symbol || "OCEAN"
                } pool.`,
              ]
            : []
        }
      />
      <TransactionDoneModal
        show={showTxDone}
        txHash={recentTxHash}
        close={() => setShowTxDone(false)}
      />
    </>
  );
};

export default RemoveAmount;
