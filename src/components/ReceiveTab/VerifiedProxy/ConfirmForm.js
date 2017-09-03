import React, { Component } from 'react';
import serverApi from "../../../utils/quid-server-api";
import web3Api from "../../../utils/web3-common-api";
import ksHelper from'../../../utils/keystoreHelper';
import sha3 from 'solidity-sha3';
const util = require("ethereumjs-util");
import PhoneForm from './PhoneForm';

export default class ReceivePhoneTab extends Component {
    constructor(props) {
        super(props);
        this.state = {
            smsCode: "",
	    isFetching: false
        };
    }

    submit() {
        const component = this;
        console.log(this.state);
	this.setState({isFetching: true});
        serverApi.verifyPhone(this.props.phone, this.props.code, this.state.smsCode)
	    .then(function(result) {
		console.log({result});
		return result;
            }).then(function(result) {
		console.log(result);
		const msg = sha3(component.props.to);
		
		const signature = ksHelper.signTx(result.transfer.verificationKeystoreData, component.props.code, msg);
		console.log("signature: ", signature);
		
		const v = signature.v;
		const r =  '0x' + signature.r.toString("hex");
		const s =  '0x' + signature.s.toString("hex");	    	    
		// const sigParams = `"${component.props.to}",${v},"${r}","${s}"`;
		// console.log({sigParams});
		
		// TESTING SIG
		// const pub = util.ecrecover(util.toBuffer(msg), signature.v, signature.r, signature.s);
		// const adr = '0x' + util.pubToAddress(pub).toString('hex');
		// console.log({adr});
		// /TESTING SIG
		
		return serverApi.confirmTx(
		    component.props.phone, 
                    component.props.code,  
                    component.state.smsCode, 
                    component.props.to, v, r, s);
            }).then(function(result) {
		console.log({result});
		component.setState({isFetching: false});		
		component.props.onSuccess(result.pendingTxHash);
            }).catch(function(err) {
		console.log({err});
		component.setState({
		    error: (err.message || err.errorMessage || "Server error!") ,
		    isFetching: false
		});
	    });
    }



    render() {
        const component = this;
        return (
           <div>
            
        <div className="radio radio-warning">
          

            <div>
                <input type="text" onChange={(event)=>this.setState({smsCode:event.target.value})} />
            </div>
        </div>
                {this.state.isFetching ? <div className="loader-spin"></div> : ""}		
        <div>
		<a className="btn btn-md btn-accent" onClick={()=>component.submit()}>Send</a>
		<span style={ {color: "red"}} > {component.state.error }</span>
        </div>
        </div>
        );
    }
}