import { ethers } from "ethers";

export const getQueryId = (tx: ethers.ContractReceipt): string => {
  const events = tx.events
  let queryId = ""
  if (events !== undefined) {
    queryId = events[0].args?.queryId
  } else {
    throw new Error("QueryId is not found")
  }

  return queryId
}
