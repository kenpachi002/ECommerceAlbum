import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Wallet, Plus, ArrowDownLeft, ArrowUpRight, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "../features/auth/AuthContext";
import { apiClient } from "../lib/apiClient";

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositing, setDepositing] = useState(false);
    const [success, setSuccess] = useState(null);

  const fetchWallet = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.getWallet();
      setBalance(data.balance ?? 0);
      setTransactions(data.transactions || []);
    } catch (err) { setError(err.message); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchWallet(); }, [fetchWallet]);

  const handleDeposit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) { setError("Enter a valid amount"); return; }
    setDepositing(true);
    setError(null);
    setSuccess(null);
    try {
          const res = await apiClient.depositWallet(Math.round(amount * 100));
    setSuccess(`$${(amount).toFixed(2)} added to your wallet`);
      setDepositAmount("");
      fetchWallet();
    } catch (err) { setError(err.message); }
    setDepositing(false);
  };

  return (
    <div className="wallet-page">
      <Link className="back-link" to="/"><ArrowLeft size={15} /> Back to catalog</Link>
      <h1 className="wallet-page__title"><Wallet size={28} className="wallet-page__icon" /> Wallet</h1>

      {success && <div className="wallet__success"><CheckCircle size={16} /> {success}</div>}
      {error && <div className="wallet__error"><AlertCircle size={16} /> {error}</div>}

      <div className="wallet-balance-card">
        <span className="wallet-balance__label">Available Balance</span>
        <span className="wallet-balance__amount">${(balance / 100).toFixed(2)}</span>
        <form className="wallet-deposit" onSubmit={handleDeposit}>
          <div className="wallet-deposit__input">
            <span className="wallet-deposit__currency">$</span>
            <input type="number" step="0.01" min="0.01" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="0.00" />
          </div>
          <button type="submit" className="button button--primary" disabled={depositing}>
            {depositing ? <Loader2 size={15} className="spin" /> : <><Plus size={15} /> Add Funds</>}
          </button>
        </form>
      </div>

      <div className="wallet-transactions">
        <h2 className="wallet-transactions__title">Transaction History</h2>
        {loading ? (
          <div className="wallet__loading"><Loader2 size={24} className="spin" /><p>Loading…</p></div>
        ) : transactions.length === 0 ? (
          <div className="wallet__empty"><Wallet size={40} className="wallet__empty-icon" /><p>No transactions yet</p></div>
        ) : (
          <div className="wallet-tx-list">
            {transactions.map((tx) => (
              <div key={tx.id} className={`wallet-tx${tx.amountCents < 0 ? " wallet-tx--debit" : " wallet-tx--credit"}`}>
                <div className="wallet-tx__icon">
                  {tx.amountCents < 0 ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                </div>
                <div className="wallet-tx__info">
                  <span className="wallet-tx__desc">{tx.description || tx.type}</span>
                  <span className="wallet-tx__date">{new Date(tx.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
                <span className={`wallet-tx__amount${tx.amountCents < 0 ? " wallet-tx__amount--debit" : " wallet-tx__amount--credit"}`}>
                  {tx.amountCents < 0 ? "-" : "+"}${Math.abs(tx.amountCents / 100).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
