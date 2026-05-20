alter table public.funding_payments
  add column if not exists actual_applied numeric;

update public.funding_payments
set actual_applied = payment_amount
where actual_applied is null;

-- Recompute liquidation prices for open positions from current isolated margin.
update public.positions p
set liquidation_price = case
  when p.side = 'LONG' then
    p.entry_price * (1 - (p.margin_allocated / p.size) + 0.005)
  else
    p.entry_price * (1 + (p.margin_allocated / p.size) - 0.005)
end
where p.is_open = true
  and p.size > 0
  and p.entry_price > 0;
