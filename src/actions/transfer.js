import web3Service from "../services/web3Service";
// import escrowContract from "../services/eth2phone/escrowContract";
import { getPendingTransfers } from './../data/selectors';
import * as e2pService from '../services/eth2phone';
import * as actionTypes from './types';


const createTransfer = (payload) => {
    return {
        type: actionTypes.CREATE_TRANSFER,
        payload
    };
}


const updateTransfer = (payload) => {
    return {
        type: actionTypes.UPDATE_TRANSFER,
        payload
    };
}

const subscribePendingTransferMined = (transfer) => {
    return async (dispatch, getState) => {
	const web3 = web3Service.getWeb3();
	const txReceipt = await web3.eth.getTransactionReceiptMined(transfer.txHash);
	console.log("transaction mined!!");
	
	dispatch(updateTransfer({
	    status: 'sent',
	    id: transfer.id
	}));	
    };
}


// find all pending transfers and update status when they will be mined
export const subscribePendingTransfers = () => {
    return  (dispatch, getState) => {
	const state = getState();
	const pendingTransfers = getPendingTransfers(state);
	console.log("got pending transfers: ", {pendingTransfers})
	pendingTransfers.map(transfer => {
	    dispatch(subscribePendingTransferMined(transfer));
	});
    };
}



export const sendTransfer = ({phone,  phoneCode, amount}) => {
    return async (dispatch, getState) => {
	
	const state = getState();
	const senderAddress = state.web3Data.address;

	const { txHash, secretCode, transferId, transitAddress } = await e2pService.sendTransfer({phone, phoneCode, amountToPay: amount});
	const id = `${transferId}-out`;

	const transfer = {
	    id,
	    txHash,
	    secretCode,
	    transferId,
	    transitAddress,
	    senderAddress,
	    status: 'pending',
	    receiverPhone: phone,
	    receiverPhoneCode: phoneCode,
	    timestamp: Date.now(),
	    amount,	    
	    fee: 0,
	    direction: 'out'
	};
	console.log({transfer});
	dispatch(createTransfer(transfer));

	// subscribe
	dispatch(subscribePendingTransferMined(transfer));
	
	return transfer;
    };
}


export const withdrawTransfer = ({phone,  phoneCode, secretCode, smsCode }) => {
    return async (dispatch, getState) => {
	
	const state = getState();
	const receiverAddress = state.web3Data.address;
	
	const { txHash, transfer: transferFromServer, amount } = await e2pService.verifyPhoneAndWithdraw({
	    phoneCode,
	    phone,
	    secretCode,
	    smsCode,
	    receiverAddress
	});
	
	const id = `${transferFromServer.transferId}-IN`;
	const transfer = {
	    id,
	    txHash,
	    secretCode,
	    transferId: transferFromServer.transferId,
	    transitAddress: transferFromServer.transitAddress,
	    status: 'pending',
	    receiverPhone: phone,
	    receiverPhoneCode: phoneCode,
	    receiverAddress,
	    timestamp: Date.now(),
	    amount,	    
	    fee: 0,
	    direction: 'in'
	};
	console.log({transfer});
	dispatch(createTransfer(transfer));

	// // subscribe
	dispatch(subscribePendingTransferMined(transfer));	
	return transfer;
    };
}