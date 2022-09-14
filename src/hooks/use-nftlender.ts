import { BigNumber, BigNumberish, ethers } from 'ethers';
import { Interface } from 'ethers/lib/utils';
import { useContractRead } from 'wagmi';

import nftLenderJSON from '../assets/abis/NFTLender.json';
import { IDeposit, ILoan } from '../utils/interfaces';
import { DUMMYNFT_CONTRACT_ADDRESS } from './use-dummynft';

export const NFTLENDER_ABI = new Interface(nftLenderJSON.abi);
export const NFTLENDER_CONTRACT_ADDRESS = '0xf85895d097b2c25946bb95c4d11e2f3c035f8f0c';

export const INTEREST_RATE = 316887385;

export function useGetFloorPrice(forAddress: string | undefined = DUMMYNFT_CONTRACT_ADDRESS): {data: BigNumberish | undefined, isError: boolean, refetch: (options?: any) => any} {
  const { data, isError, refetch } = useContractRead({
    addressOrName: NFTLENDER_CONTRACT_ADDRESS,
    contractInterface: NFTLENDER_ABI,
    functionName: 'getFloorPrice',
    args: forAddress,
  })

  return { data, isError, refetch };
}

export function useMaxAmountLoan(forAddress: string | undefined): {maxAmountLoan: BigNumber, error: Error | null, refetch: (options?: any) => any} {
  const { data, error, refetch } = useContractRead({
    addressOrName: NFTLENDER_CONTRACT_ADDRESS,
    contractInterface: nftLenderJSON.abi,
    functionName: 'maxAmountLoan',
    args: forAddress!,
    enabled: Boolean(forAddress),
    watch: true
  })

  const maxAmountLoan: BigNumber = data? BigNumber.from(data) : BigNumber.from(0);
  
  return { maxAmountLoan, error, refetch };
}

export function useGetFullDebt(forAddress: string | undefined): {fullDebt: BigNumber, error: Error | null, refetch: (options?: any) => any} {
  const { data, error, refetch } = useContractRead({
    addressOrName: NFTLENDER_CONTRACT_ADDRESS,
    contractInterface: nftLenderJSON.abi,
    functionName: 'getFullDebt',
    enabled: Boolean(forAddress),
    overrides: { from: forAddress },
    watch: true
  });
  
  const fullDebt: BigNumber = data? BigNumber.from(data) : BigNumber.from(0);
  
  return { fullDebt, error, refetch };
}

export function useWithdrawAmountLeft(forAddress: string | undefined): BigNumber {
  const {maxAmountLoan} = useMaxAmountLoan(forAddress);
  const {fullDebt} = useGetFullDebt(forAddress);

  return maxAmountLoan.sub(fullDebt);
}

export function useHealthFactor(
  forAddress: string | undefined,
  nftToWithdraw?: {contractAddress: string | undefined, id: BigNumber | undefined}): {healthFactor: BigNumber, refetchHealthFactor: any} {
    const { data, error, refetch: refetchHealthFactor } = useContractRead({
      addressOrName: NFTLENDER_CONTRACT_ADDRESS,
      contractInterface: nftLenderJSON.abi,
      functionName: 'getHealthFactor',
      enabled: Boolean(forAddress),
      overrides: { from: forAddress },
      watch: true
    });
    
    const healthFactor: BigNumber = data? BigNumber.from(data) : BigNumber.from(0);
    
    return { healthFactor, refetchHealthFactor };
  // const {deposits} = useGetDeposits(forAddress);
  // const {fullDebt} = useGetFullDebt(forAddress)

  // if (fullDebt.eq(BigNumber.from('0'))) {
  //   return BigNumber.from('200');
  // }

  // let collateral = deposits.reduce((prevVal, currVal) => {   
  //   if (Boolean(nftToWithdraw) 
  //     && nftToWithdraw!.contractAddress! === currVal.address 
  //     && nftToWithdraw!.id!.eq(currVal.tokenId)) {
  //     return prevVal;
  //   }
  //   return prevVal.add(ethers.utils.parseEther('1'));
  // }, BigNumber.from('0'));

  // const liquidationThreshold = collateral
  //   .mul(BigNumber.from('8000'))
  //   .div(BigNumber.from('100'));

  // return liquidationThreshold.div(fullDebt);
}


export function useGetDeposits(forAddress: string | undefined): {deposits: IDeposit[], error: Error | null, refetch: (options?: any) => any} {
  const { data, error, refetch } = useContractRead({
    addressOrName: NFTLENDER_CONTRACT_ADDRESS,
    contractInterface: nftLenderJSON.abi,
    functionName: 'getDepositFor',
    args: [forAddress],
    enabled: Boolean(forAddress),
    watch: true,
  });

  let deposits: IDeposit[];
  
  if (data) {
    deposits = data!.map(item => {
      return {address: item[0], tokenId: item[1], startTime: item[2]}
    });
  } else {
    deposits = [];
  }  
  
  return { deposits, error, refetch };
}

export function useGetLoans(forAddress: string | undefined): {loans: ILoan[], error: Error | null, refetch: (options?: any) => any} {
  const { data, error, refetch } = useContractRead({
    addressOrName: NFTLENDER_CONTRACT_ADDRESS,
    contractInterface: nftLenderJSON.abi,
    functionName: 'getLoanFor',
    args: [forAddress],
    enabled: Boolean(forAddress),
    watch: true,
    cacheTime: 0
  });

  let loans: ILoan[];

  if (data) {
    loans = data!.map(item => {
      return {amount: item[0], startTime: item[1], lastReimbursment: item[2]}
    });
  } else {
    loans = [];
  }
  
  return { loans, error, refetch };
}

export const useGetDebtAmountForLoan = (fromAddress: string | undefined, loan?: ILoan): BigNumber => {

  if (loan) {
    const timeElapsed = BigNumber.from(Date.now()).div(1_000).sub(loan.lastReimbursment);
    const interest = loan.amount.div(ethers.utils.parseUnits("1", 15)).mul(INTEREST_RATE);
    const fee = timeElapsed.mul(interest)
  
    return loan.amount.add(fee);
  }

  return BigNumber.from(0);
}


