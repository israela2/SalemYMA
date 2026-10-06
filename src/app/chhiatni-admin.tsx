import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';

import AppBackButton from '../components/AppBackButton';
type Member = {
  user_id?: string | null;
  full_name: string;
  house_number?: string | null;
};

type Bill = {
  id: number;
  user_id: string;
  house_number?: string | null;
  account_no?: string | null;
  bill_month?: string | null;
  amount: number;
  due_date?: string | null;
  status?: string | null;
  paid_at?: string | null;
  receipt_no?: string | null;
  payment_method?: string | null;
  payment_utr?: string | null;
  payment_submitted_at?: string | null;
  householder_name?: string | null;
  is_published?: boolean | null;
  created_at?: string | null;
};

type Settings = {
  id: number;
  upi_id: string;
  payee_name: string;
  instructions?: string | null;
};

type FundYear = {
  bill_year: string;
  created_at?: string | null;
};

const RED = '#C62828';
const RED_DARK = '#8E1B1B';
const BLACK = '#0B0B0B';
const WHITE = '#FFFFFF';
const BG = '#F5F5F5';
const BORDER = '#E5E5E5';
const TEXT = '#151515';
const MUTED = '#777777';
const LIGHT_RED = '#FBEAEA';

async function confirmWeb(title: string, message: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.confirm(`${title}\n\n${message}`);
  }
  return new Promise<boolean>((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'OK', onPress: () => resolve(true) },
    ]);
  });
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function ChhiatniAdminScreen() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [upiId, setUpiId] = useState('');
  const [payeeName, setPayeeName] = useState('YMA Salem Branch');
  const [instructions, setInstructions] = useState('Pay using any UPI app and submit the UTR after payment.');
  const [savingSettings, setSavingSettings] = useState(false);
  const [amount, setAmount] = useState('200');
  const [billYear, setBillYear] = useState(String(new Date().getFullYear()));
  const [dueDate, setDueDate] = useState('');
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [fundYears, setFundYears] = useState<FundYear[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memberPickerSearch, setMemberPickerSearch] = useState('');

  async function load() {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
        return;
      }

      const { data: admin, error: adminError } = await supabase
        .from('admins')
        .select('user_id, role, status')
        .eq('user_id', session.user.id)
        .eq('role', 'full_admin')
        .eq('status', 'approved')
        .maybeSingle();

      if (adminError || !admin) {
        setAuthorized(false);
        Alert.alert('Access denied', 'Only approved Full Access Admins can manage Chhiatni Fund.', [
          { text: 'OK', onPress: () => router.replace('/') },
        ]);
        return;
      }

      setAuthorized(true);
      const [membersResult, billsResult, settingsResult, yearsResult] = await Promise.all([
        supabase.from('members').select('user_id, full_name, house_number').order('full_name', { ascending: true }),
        supabase.from('chhiatni_fund_bills').select('*').order('created_at', { ascending: false }),
        supabase.from('chhiatni_fund_payment_settings').select('id, upi_id, payee_name, instructions').eq('id', 1).maybeSingle(),
        supabase.from('chhiatni_fund_years').select('bill_year, created_at').order('bill_year', { ascending: false }),
      ]);

      if (membersResult.error) throw membersResult.error;
      if (billsResult.error) throw billsResult.error;
      setMembers((membersResult.data || []) as Member[]);
      const loadedBills = (billsResult.data || []) as Bill[];
      setBills(loadedBills);

      // Year records are persistent history entries. If the optional history table
      // has not been created yet, fall back to distinct years from existing bills.
      if (!yearsResult.error) {
        setFundYears((yearsResult.data || []) as FundYear[]);
      } else {
        const fallback = Array.from(
          new Set(loadedBills.map((bill) => String(bill.bill_month || '').trim()).filter(Boolean))
        )
          .sort((a, b) => Number(b) - Number(a))
          .map((bill_year) => ({ bill_year }));
        setFundYears(fallback);
      }
      if (settingsResult.data) {
        const value = settingsResult.data as Settings;
        setSettings(value);
        setUpiId(value.upi_id || '');
        setPayeeName(value.payee_name || 'YMA Salem Branch');
        setInstructions(value.instructions || 'Pay using any UPI app and submit the UTR after payment.');
      }
    } catch (error: any) {
      Alert.alert('Load failed', error?.message || 'Unable to load Chhiatni Fund administration.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const unpaid = bills.filter((bill) => (bill.status || '').toLowerCase() !== 'paid');
  const paid = bills.filter((bill) => (bill.status || '').toLowerCase() === 'paid');
  const outstanding = unpaid.reduce((sum, bill) => sum + Number(bill.amount || 0), 0);

  const filteredBills = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bills;
    return bills.filter((bill) => {
      const member = members.find((item) => item.user_id === bill.user_id);
      return [bill.house_number, bill.account_no, bill.bill_month, bill.status, bill.payment_utr, member?.full_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [bills, members, search]);

  const groupedBills = useMemo(() => {
    const billMap = new Map<string, Bill[]>();
    filteredBills.forEach((bill) => {
      const year = String(bill.bill_month || '').trim();
      if (!year) return;
      const current = billMap.get(year) || [];
      current.push(bill);
      billMap.set(year, current);
    });

    const allYears = new Set<string>();
    fundYears.forEach((item) => {
      const year = String(item.bill_year || '').trim();
      if (year) allYears.add(year);
    });
    bills.forEach((bill) => {
      const year = String(bill.bill_month || '').trim();
      if (year) allYears.add(year);
    });

    const query = search.trim().toLowerCase();
    return Array.from(allYears)
      .filter((year) => {
        if (!query) return true;
        if (year.toLowerCase().includes(query)) return true;
        return (billMap.get(year) || []).length > 0;
      })
      .map((year) => [year, billMap.get(year) || []] as [string, Bill[]])
      .sort((a, b) => {
        const ay = Number(a[0]);
        const by = Number(b[0]);
        if (Number.isFinite(ay) && Number.isFinite(by)) return by - ay;
        return b[0].localeCompare(a[0]);
      });
  }, [bills, filteredBills, fundYears, search]);

  const filteredMembersForPicker = useMemo(() => {
    const q = memberPickerSearch.trim().toLowerCase();
    const list = members.filter((member) => Boolean(member.user_id));
    if (!q) return list;
    return list.filter((member) =>
      [member.full_name, member.house_number]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [members, memberPickerSearch]);

  function toggleMemberSelection(userId?: string | null) {
    if (!userId) return;
    setSelectedMemberIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    );
  }

  function toggleAllVisibleMembers() {
    const visibleIds = filteredMembersForPicker
      .map((member) => member.user_id)
      .filter(Boolean) as string[];
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedMemberIds.includes(id));
    setSelectedMemberIds((current) => {
      if (allSelected) return current.filter((id) => !visibleIds.includes(id));
      return Array.from(new Set([...current, ...visibleIds]));
    });
  }

  async function saveSettings() {
    if (!upiId.trim() || !upiId.includes('@')) {
      Alert.alert('Invalid UPI ID', 'Enter a valid UPI ID such as example@upi.');
      return;
    }
    try {
      setSavingSettings(true);
      const { data, error } = await supabase
        .from('chhiatni_fund_payment_settings')
        .upsert({
          id: 1,
          upi_id: upiId.trim(),
          payee_name: payeeName.trim() || 'YMA Salem Branch',
          instructions: instructions.trim() || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' })
        .select('id, upi_id, payee_name, instructions')
        .single();
      if (error) throw error;
      setSettings(data as Settings);
      Alert.alert('Saved', 'Chhiatni Fund payment settings updated successfully.');
    } catch (error: any) {
      Alert.alert('Save failed', error?.message || 'Unable to save payment settings.');
    } finally {
      setSavingSettings(false);
    }
  }

  const selectedHouseNumbers = useMemo(() => {
    const seen = new Set<string>();
    members
      .filter((member) => Boolean(member.user_id) && selectedMemberIds.includes(member.user_id as string))
      .forEach((member) => {
        const house = member.house_number?.trim();
        if (house) seen.add(house);
      });
    return Array.from(seen);
  }, [members, selectedMemberIds]);

  async function createBills() {
    const numericAmount = Number(amount.replace(/,/g, ''));
    const year = billYear.trim();
    const due = dueDate.trim() || null;
    if (!/^\d{4}$/.test(year)) {
      Alert.alert('Billing year required', 'Enter a 4-digit billing year, for example 2026.');
      return;
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      Alert.alert('Invalid amount', 'Enter a Chhiatni Fund amount greater than zero.');
      return;
    }
    if (!selectedMemberIds.length) {
      Alert.alert('Select family member', "Select at least one registered member. One selected member represents the whole household by House Number.");
      return;
    }

    const selectedMembers = members.filter(
      (member) => Boolean(member.user_id) && selectedMemberIds.includes(member.user_id as string)
    );
    const selectedFamilies = Array.from(
      new Map(
        selectedMembers
          .map((member) => {
            const house = member.house_number?.trim();
            if (!house || !member.user_id) return null;
            return [house, member] as const;
          })
          .filter(Boolean) as Array<[string, Member]>
      ).entries()
    ).map(([houseNumber, member]) => ({ houseNumber, member }));

    if (!selectedFamilies.length) {
      Alert.alert('House Number required', 'Every selected member must have a House Number before creating a Chhiatni Fund bill.');
      return;
    }

    const confirmed = await confirmWeb(
      'Create household Chhiatni Fund bills?',
      `Create one ₹${numericAmount.toFixed(2)} yearly bill for ${selectedFamilies.length} household${selectedFamilies.length === 1 ? '' : 's'} for ${year}? Selecting one member bills the whole family registered under that House Number.`
    );
    if (!confirmed) return;

    try {
      setCreating(true);

      const { error: yearError } = await supabase
        .from('chhiatni_fund_years')
        .upsert({ bill_year: year }, { onConflict: 'bill_year' });

      if (yearError) {
        console.warn('Unable to register Chhiatni Fund year history:', yearError.message);
      }

      const houseNumbers = selectedFamilies.map((item) => item.houseNumber);
      const { data: existing, error: existingError } = await supabase
        .from('chhiatni_fund_bills')
        .select('id, user_id, house_number, bill_month')
        .eq('bill_month', year)
        .in('house_number', houseNumbers);

      if (existingError) {
        throw new Error(`Unable to check existing ${year} household bills. ${existingError.message}`);
      }

      const existingHouses = new Set(
        (existing || [])
          .map((row: any) => String(row.house_number || '').trim())
          .filter(Boolean)
      );

      const rows = selectedFamilies
        .filter(({ houseNumber }) => !existingHouses.has(houseNumber))
        .map(({ houseNumber, member }) => ({
          // Representative member only; visibility and payment are household-based
          // through house_number, so all members of the family share this bill.
          user_id: member.user_id,
          house_number: houseNumber,
          account_no: houseNumber,
          bill_month: year,
          amount: numericAmount,
          due_date: due,
          status: 'unpaid',
          householder_name: member.full_name?.trim() || null,
        }));

      if (!rows.length) {
        Alert.alert('No new household bills', `All selected House Numbers already have a Chhiatni Fund bill for ${year}.`);
        return;
      }

      for (let i = 0; i < rows.length; i += 100) {
        const { error } = await supabase.from('chhiatni_fund_bills').insert(rows.slice(i, i + 100));
        if (error) throw error;
      }

      const skippedFamilies = selectedFamilies.length - rows.length;
      setSelectedMemberIds([]);
      setMemberPickerSearch('');
      Alert.alert(
        'Household bills created',
        `${rows.length} household bill${rows.length === 1 ? '' : 's'} created for ${year}.${skippedFamilies ? ` ${skippedFamilies} selected household${skippedFamilies === 1 ? '' : 's'} already had a bill for this year.` : ''}`
      );
      await load();
    } catch (error: any) {
      console.error('Chhiatni Fund create bill error:', error);
      Alert.alert('Creation failed', error?.message || 'Unable to create household Chhiatni Fund bills.');
    } finally {
      setCreating(false);
    }
  }

  async function markPaid(bill: Bill, method: 'Cash' | 'Admin' = 'Admin') {
    const member = members.find((item) => item.user_id === bill.user_id);
    const defaultName = bill.householder_name || member?.full_name || '';
    let holderName = defaultName;

    if (method === 'Cash') {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        holderName = window.prompt('House Holder Name', defaultName) || '';
      } else {
        Alert.alert('House Holder Name', 'Please use the house holder name already shown on the bill, or update the member profile first.');
      }
      if (!holderName.trim()) return;
      if (!(await confirmWeb('Record Cash Payment?', `Record ₹${Number(bill.amount || 0).toFixed(2)} as CASH PAID for House No. ${bill.house_number || '-'} by ${holderName.trim()}?`))) return;
    } else {
      if (!(await confirmWeb('Verify payment?', `Verify ₹${Number(bill.amount || 0).toFixed(2)} for House No. ${bill.house_number || '-'} and issue a receipt?`))) return;
    }

    try {
      const receiptNo = `YMA-CF-${Date.now()}`;
      const { error } = await supabase.from('chhiatni_fund_bills').update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        receipt_no: receiptNo,
        payment_method: method,
        householder_name: holderName.trim() || bill.householder_name || null,
        is_published: true,
        updated_at: new Date().toISOString(),
      }).eq('id', bill.id);
      if (error) throw error;
      await load();
    } catch (error: any) {
      Alert.alert('Update failed', error?.message || 'Unable to update payment.');
    }
  }

  async function deleteBill(bill: Bill) {
    if (!(await confirmWeb('Delete family bill?', `Permanently delete the ${bill.bill_month || ''} bill for House No. ${bill.house_number || '-'}?`))) return;
    try {
      const { data, error } = await supabase.rpc('admin_delete_record', {
        p_table_name: 'chhiatni_fund_bills',
        p_record_id: String(bill.id),
      });
      if (error) throw error;
      if (data !== true) throw new Error('The database did not confirm deletion.');
      await load();
    } catch (error: any) {
      Alert.alert('Delete failed', error?.message || 'Unable to delete family bill.');
    }
  }

  async function togglePublished(bill: Bill) {
    if ((bill.status || '').toLowerCase() !== 'paid') return;
    const next = bill.is_published === false;
    try {
      const { error } = await supabase
        .from('chhiatni_fund_bills')
        .update({
          is_published: next,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bill.id);
      if (error) throw error;
      setBills((current) =>
        current.map((item) =>
          item.id === bill.id ? { ...item, is_published: next } : item
        )
      );
    } catch (error: any) {
      Alert.alert('Update failed', error?.message || 'Unable to change publish status.');
    }
  }

  function escapeHtml(value: unknown) {
    return String(value ?? '-')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async function reportYear(year: string, yearBills: Bill[]) {
    const paidRows = yearBills.filter((bill) => (bill.status || '').toLowerCase() === 'paid');
    if (!paidRows.length) {
      Alert.alert('No paid bills', `There are no paid Chhiatni Fund bills in ${year} yet.`);
      return;
    }

    const rows = paidRows
      .sort((a, b) => {
        const ad = new Date(a.paid_at || a.payment_submitted_at || a.created_at || 0).getTime();
        const bd = new Date(b.paid_at || b.payment_submitted_at || b.created_at || 0).getTime();
        return ad - bd;
      })
      .map((bill, index) => {
        const member = members.find((item) => item.user_id === bill.user_id);
        const household = bill.householder_name || member?.full_name || bill.house_number || '-';
        const paymentDate = bill.paid_at || bill.payment_submitted_at || bill.created_at;
        return `<tr>
          <td class="serial">${index + 1}</td>
          <td>${escapeHtml(household)}</td>
          <td>Chhiatni Fund - ${escapeHtml(year)}</td>
          <td>${escapeHtml(formatDateTime(paymentDate))}</td>
          <td class="receipt">${escapeHtml(bill.receipt_no || '-')}</td>
        </tr>`;
      })
      .join('');

    const generated = formatDateTime(new Date().toISOString());
    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(year)} Chhiatni Fund Pe List - YMA Salem Branch</title>
<style>
  @page { size: A4 portrait; margin: 18mm 14mm; }
  * { box-sizing: border-box; }
  body { margin:0; font-family: Arial, Helvetica, sans-serif; color:#161616; background:#fff; }
  .top { border-top: 5px solid #C62828; padding-top: 14px; text-align:center; }
  .brand { font-size: 12px; letter-spacing: 2px; font-weight: 800; color:#8E1B1B; text-transform:uppercase; }
  h1 { margin: 5px 0 2px; font-size: 24px; letter-spacing:.2px; }
  .year { margin:0; font-size: 18px; font-weight:800; color:#C62828; }
  .meta { margin-top: 8px; font-size: 10px; color:#666; }
  table { width:100%; border-collapse:collapse; margin-top:22px; font-size:10.5px; }
  th { background:#111; color:#fff; text-align:left; padding:9px 8px; font-size:9px; letter-spacing:.6px; text-transform:uppercase; }
  td { border:1px solid #dedede; padding:9px 8px; vertical-align:middle; }
  tr:nth-child(even) td { background:#fafafa; }
  .serial { width:44px; text-align:center; }
  .receipt { font-family: monospace; font-size:9.5px; }
  .footer { margin-top:18px; display:flex; justify-content:space-between; gap:20px; font-size:9px; color:#777; border-top:1px solid #e2e2e2; padding-top:9px; }
  .total { font-weight:800; color:#222; }
</style>
</head>
<body>
  <div class="top">
    <div class="brand">YMA Salem Branch</div>
    <h1>${escapeHtml(year)} CHHIATNI FUND PE LIST</h1>
    <p class="year">Yearly Payment History</p>
    <div class="meta">${paidRows.length} paid household${paidRows.length === 1 ? '' : 's'} &nbsp; | &nbsp; Generated ${escapeHtml(generated)}</div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Serial Number</th>
        <th>Household Name</th>
        <th>Fund / Bill</th>
        <th>Payment Creation Date</th>
        <th>Receipt Number</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">
    <div>YMA Salem Branch - Chhiatni Fund</div>
    <div class="total">Total Paid: ${paidRows.length}</div>
  </div>
  <script>window.onload=function(){setTimeout(function(){window.print()},300)};</script>
</body>
</html>`;

    try {
      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (!printWindow) throw new Error('Please allow pop-ups to print/download the yearly list.');
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        return;
      }
      const file = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Save / share ${year} Chhiatni Fund Pe List`,
        });
      } else {
        await Print.printAsync({ html });
      }
    } catch (error: any) {
      Alert.alert('PDF error', error?.message || 'Unable to create the yearly Chhiatni Fund PDF.');
    }
  }

  async function report() {
    const rows = bills.map((bill) => {
      const member = members.find((item) => item.user_id === bill.user_id);
      return `<tr><td>${bill.house_number || '-'}</td><td>${bill.householder_name || member?.full_name || '-'}</td><td>${bill.bill_month || '-'}</td><td>₹${Number(bill.amount || 0).toFixed(2)}</td><td>${bill.status || '-'}</td><td>${bill.payment_utr || '-'}</td><td>${bill.receipt_no || '-'}</td><td>${formatDateTime(bill.paid_at || bill.payment_submitted_at || bill.created_at)}</td></tr>`;
    }).join('');
    const html = `<html><body style="font-family:Arial;padding:24px"><h1>YMA Salem Branch — Chhiatni Fund Payment Report</h1><p>Generated ${formatDateTime(new Date().toISOString())}</p><table style="width:100%;border-collapse:collapse;font-size:11px"><thead><tr><th>House No.</th><th>House Holder</th><th>Year</th><th>Amount</th><th>Status</th><th>UTR</th><th>Receipt</th><th>Date</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
    try {
      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (!printWindow) throw new Error('Please allow pop-ups to print the report.');
        printWindow.document.write(`${html.replace('</body>', '<script>window.onload=function(){setTimeout(function(){window.print()},300)}</script></body>')}`);
        printWindow.document.close();
        return;
      }
      const file = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', dialogTitle: 'Save / share Chhiatni Fund report' });
      else await Print.printAsync({ html });
    } catch (error: any) {
      Alert.alert('Report error', error?.message || 'Unable to create report.');
    }
  }

  if (loading) {
    return <View style={styles.loading}><ActivityIndicator size="large" color={RED} /><Text style={styles.loadingText}>Loading Chhiatni Fund...</Text></View>;
  }

  if (!authorized) {
    return <View style={styles.loading}><Text style={styles.denied}>Access Denied</Text></View>;
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={[RED, BLACK]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.headerTop}>
          <AppBackButton />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.eyebrow}>YMA Salem Branch</Text>
            <Text style={styles.title}>Chhiatni Fund</Text>
            <Text style={styles.subtitle}>Family bill & payment management</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}><Text style={styles.summaryNumber}>{members.filter(m => m.house_number?.trim()).length}</Text><Text style={styles.summaryLabel}>Members with House No.</Text></View>
          <View style={styles.summaryCard}><Text style={styles.summaryNumber}>{bills.length}</Text><Text style={styles.summaryLabel}>Member Bills</Text></View>
          <View style={styles.summaryCard}><Text style={styles.summaryNumber}>{paid.length}</Text><Text style={styles.summaryLabel}>Paid</Text></View>
          <View style={styles.summaryCard}><Text style={styles.summaryNumber}>₹{outstanding.toFixed(0)}</Text><Text style={styles.summaryLabel}>Outstanding</Text></View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Payment Settings</Text>
          <Text style={styles.description}>Set the UPI destination members will use. The member app will show the QR code and UPI payment button.</Text>
          <Text style={styles.label}>UPI ID</Text>
          <TextInput value={upiId} onChangeText={setUpiId} placeholder="example@upi" placeholderTextColor="#999" style={styles.input} autoCapitalize="none" />
          <Text style={styles.label}>Payee Name</Text>
          <TextInput value={payeeName} onChangeText={setPayeeName} placeholder="YMA Salem Branch" placeholderTextColor="#999" style={styles.input} />
          <Text style={styles.label}>Payment Instructions</Text>
          <TextInput value={instructions} onChangeText={setInstructions} placeholder="Payment instructions" placeholderTextColor="#999" style={[styles.input, styles.textArea]} multiline />
          {upiId ? <Image source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=${payeeName || 'YMA Salem Branch'}&cu=INR`)}` }} style={styles.qr} /> : null}
          <Pressable onPress={saveSettings} disabled={savingSettings} style={styles.primary}>
            {savingSettings ? <ActivityIndicator color={WHITE} /> : <Text style={styles.primaryText}>SAVE PAYMENT SETTINGS</Text>}
          </Pressable>
          <Pressable onPress={report} style={styles.outline}><Text style={styles.outlineText}>DOWNLOAD PAYMENT REPORT</Text></Pressable>
        </View>

        <LinearGradient colors={[RED, BLACK]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View><Text style={styles.heroEyebrow}>OUTSTANDING SELECTED-MEMBER FUND</Text><Text style={styles.heroAmount}>₹{outstanding.toFixed(2)}</Text><Text style={styles.heroMeta}>{unpaid.length} unpaid member bill{unpaid.length === 1 ? '' : 's'}</Text></View>
          <Text style={styles.heroIcon}>🤝</Text>
        </LinearGradient>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Create Chhiatni Fund Bills</Text>
          <Text style={styles.description}>Select a member to represent a household. Members sharing the same House Number are one family for billing, so only one yearly bill is created per House Number.</Text>

          <View style={styles.memberPickerHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>SELECT MEMBERS</Text>
              <Text style={styles.selectedCount}>{selectedMemberIds.length} member{selectedMemberIds.length === 1 ? '' : 's'} selected • {selectedHouseNumbers.length} household{selectedHouseNumbers.length === 1 ? '' : 's'}</Text>
            </View>
            <Pressable onPress={toggleAllVisibleMembers} style={styles.selectAllButton}>
              <Text style={styles.selectAllButtonText}>{
                filteredMembersForPicker.length && filteredMembersForPicker.every((member) => member.user_id && selectedMemberIds.includes(member.user_id))
                  ? 'CLEAR VISIBLE'
                  : 'SELECT ALL VISIBLE'
              }</Text>
            </Pressable>
          </View>

          <TextInput
            value={memberPickerSearch}
            onChangeText={setMemberPickerSearch}
            placeholder="Search member or House No."
            placeholderTextColor="#999"
            style={styles.input}
          />

          <ScrollView style={styles.memberPickerList} nestedScrollEnabled showsVerticalScrollIndicator={false}>
            {filteredMembersForPicker.map((member) => {
              const selected = Boolean(member.user_id && selectedMemberIds.includes(member.user_id));
              return (
                <Pressable
                  key={member.user_id}
                  onPress={() => toggleMemberSelection(member.user_id)}
                  style={({ pressed }) => [styles.memberPickerItem, selected && styles.memberPickerItemSelected, pressed && { opacity: 0.82 }]}
                >
                  <View style={[styles.memberCheck, selected && styles.memberCheckSelected]}>
                    <Text style={styles.memberCheckText}>{selected ? '✓' : ''}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.memberPickerName}>{member.full_name || 'Unnamed member'}</Text>
                    <Text style={styles.memberPickerMeta}>House No. {member.house_number || '—'}</Text>
                  </View>
                </Pressable>
              );
            })}
            {!filteredMembersForPicker.length ? (
              <View style={styles.memberPickerEmpty}>
                <Text style={styles.memberPickerEmptyText}>No matching members.</Text>
              </View>
            ) : null}
          </ScrollView>

          <Text style={styles.label}>AMOUNT PER HOUSEHOLD</Text>
          <TextInput value={amount} onChangeText={setAmount} placeholder="200" placeholderTextColor="#999" style={styles.input} keyboardType="decimal-pad" />
          <Text style={styles.label}>BILLING YEAR</Text>
          <TextInput value={billYear} onChangeText={setBillYear} placeholder="2026" placeholderTextColor="#999" style={styles.input} />
          <Text style={styles.label}>DUE DATE (OPTIONAL)</Text>
          <TextInput value={dueDate} onChangeText={setDueDate} placeholder="2026-10-31" placeholderTextColor="#999" style={styles.input} />
          <Pressable onPress={createBills} disabled={creating} style={[styles.primary, !selectedMemberIds.length && styles.primaryDisabled]}>
            {creating ? <ActivityIndicator color={WHITE} /> : <Text style={styles.primaryText}>{selectedHouseNumbers.length ? `CREATE ${selectedHouseNumbers.length} HOUSEHOLD BILL${selectedHouseNumbers.length === 1 ? '' : 'S'}` : 'SELECT FAMILY MEMBER TO CREATE BILL'}</Text>}
          </Pressable>
        </View>

        <View style={styles.listHeader}>
          <View>
            <Text style={styles.sectionTitle}>Chhiatni Fund History</Text>
            <Text style={styles.description}>
              Every billing year you create is kept here. Open 2026, 2027, 2028 or any future year to view that year's complete Bill History and payment information.
            </Text>
          </View>
        </View>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search House No., member, year or UTR"
          placeholderTextColor="#999"
          style={styles.search}
        />

        {groupedBills.map(([year, yearBills]) => {
          const archivedBills = yearBills.filter((item) => {
            const status = (item.status || '').toLowerCase();
            return status === 'paid' || Boolean(item.payment_submitted_at) || Boolean(item.payment_utr);
          });
          const activeBills = yearBills.filter((item) => !archivedBills.some((archived) => archived.id === item.id));

          const renderBillCard = (bill: Bill, archived = false) => {
            const member = members.find((item) => item.user_id === bill.user_id);
            const status = (bill.status || '').toLowerCase();
            const isPaid = status === 'paid';
            const isPending = status === 'pending';

            return (
              <View
                key={`${archived ? 'archive' : 'active'}-${bill.id}`}
                style={[styles.billCard, archived && styles.archivedBillCard]}
              >
                <View style={styles.billTop}>
                  <View style={[styles.billIcon, archived && styles.archiveIcon]}>
                    <Text style={styles.billIconText}>{archived ? '✓' : '🤝'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.billHouse}>House No. {bill.house_number || bill.account_no || '-'}</Text>
                    <Text style={styles.billMeta}>{bill.householder_name || member?.full_name || 'Member bill'} • Account {bill.account_no || '-'}</Text>
                  </View>
                  <View style={[styles.badge, isPaid && styles.badgePaid, isPending && styles.badgePending]}>
                    <Text style={[styles.badgeText, isPaid && styles.badgePaidText, isPending && styles.badgePendingText]}>
                      {isPaid ? 'ARCHIVED' : isPending ? 'PENDING' : status ? status.toUpperCase() : 'UNPAID'}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <View>
                    <Text style={styles.detailLabel}>HOUSE HOLDER</Text>
                    <Text style={styles.detailValue}>{bill.householder_name || member?.full_name || '-'}</Text>
                  </View>
                  <View>
                    <Text style={styles.detailLabel}>AMOUNT</Text>
                    <Text style={styles.amountText}>₹{Number(bill.amount || 0).toFixed(2)}</Text>
                  </View>
                </View>

                <View style={styles.paymentInfoCard}>
                  <Text style={styles.paymentInfoTitle}>PAYMENT INFORMATION</Text>
                  <View style={styles.paymentGrid}>
                    <View style={styles.paymentField}>
                      <Text style={styles.paymentFieldLabel}>METHOD</Text>
                      <Text style={styles.paymentFieldValue}>{bill.payment_method || (isPending ? 'UPI • Awaiting verification' : 'Not paid')}</Text>
                    </View>
                    <View style={styles.paymentField}>
                      <Text style={styles.paymentFieldLabel}>UTR / TRANSACTION ID</Text>
                      <Text style={styles.paymentFieldValue}>{bill.payment_utr || '—'}</Text>
                    </View>
                    <View style={styles.paymentField}>
                      <Text style={styles.paymentFieldLabel}>SUBMITTED</Text>
                      <Text style={styles.paymentFieldValue}>{formatDateTime(bill.payment_submitted_at)}</Text>
                    </View>
                    <View style={styles.paymentField}>
                      <Text style={styles.paymentFieldLabel}>PAID ON</Text>
                      <Text style={styles.paymentFieldValue}>{formatDateTime(bill.paid_at)}</Text>
                    </View>
                    <View style={styles.paymentField}>
                      <Text style={styles.paymentFieldLabel}>RECEIPT NO.</Text>
                      <Text style={styles.paymentFieldValue}>{bill.receipt_no || '—'}</Text>
                    </View>
                  </View>
                </View>

                {isPaid ? (
                  <View style={styles.publishRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.publishTitle}>Public Payment History</Text>
                      <Text style={styles.publishHint}>{bill.is_published === false ? 'Hidden from members' : 'Published for members'}</Text>
                    </View>
                    <Pressable
                      onPress={() => togglePublished(bill)}
                      style={[styles.publishButton, bill.is_published === false ? styles.publishButtonHidden : styles.publishButtonVisible]}
                    >
                      <Text style={styles.publishButtonText}>{bill.is_published === false ? 'PUBLISH' : 'HIDE'}</Text>
                    </Pressable>
                  </View>
                ) : null}

                <View style={styles.actions}>
                  {!isPaid ? <>
                    <Pressable onPress={() => markPaid(bill, 'Cash')} style={[styles.action, styles.cashAction]}><Text style={styles.actionText}>CASH PAID</Text></Pressable>
                    <Pressable onPress={() => markPaid(bill, 'Admin')} style={styles.action}><Text style={styles.actionText}>{isPending ? 'VERIFY UPI' : 'MARK PAID'}</Text></Pressable>
                  </> : null}
                  <Pressable onPress={() => deleteBill(bill)} style={[styles.action, styles.delete]}><Text style={[styles.actionText, styles.deleteText]}>DELETE</Text></Pressable>
                </View>
              </View>
            );
          };

          const isOpen = selectedYear === year;

          return (
            <View key={year} style={styles.yearSection}>
              <Pressable
                onPress={() => setSelectedYear(isOpen ? null : year)}
                style={({ pressed }) => [styles.yearHeader, pressed && styles.yearHeaderPressed]}
                accessibilityRole="button"
                accessibilityLabel={`Open ${year} Chhiatni Fund List`}
              >
                <View style={styles.yearBadge}><Text style={styles.yearBadgeText}>{year}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.yearTitle}>{year} Chhiatni Fund List</Text>
                  <Text style={styles.yearMeta}>{yearBills.length} bill{yearBills.length === 1 ? '' : 's'} • {archivedBills.length} in Bill History{yearBills.length === 0 ? ' • Ready for new bills' : ''}</Text>
                </View>
                <Text style={styles.yearChevron}>{isOpen ? '⌃' : '›'}</Text>
              </Pressable>

              {isOpen ? (
                <View style={styles.yearDetailPanel}>
                  <View style={styles.yearDetailTop}>
                    <AppBackButton
                      onPress={() => setSelectedYear(null)}
                      accessibilityLabel={`Back to Chhiatni Fund years`}
                    />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.yearDetailEyebrow}>CHHIATNI FUND • {year}</Text>
                      <Text style={styles.yearDetailTitle}>Bill History</Text>
                      <Text style={styles.yearDetailSubtitle}>{yearBills.length} total bill{yearBills.length === 1 ? '' : 's'} for this billing year</Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={() => reportYear(year, yearBills)}
                    style={({ pressed }) => [styles.yearPdfButton, pressed && styles.yearPdfButtonPressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`Print or download ${year} Chhiatni Fund paid list as PDF`}
                  >
                    <View style={styles.yearPdfIcon}><Text style={styles.yearPdfIconText}>PDF</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.yearPdfTitle}>PRINT / DOWNLOAD PDF</Text>
                      <Text style={styles.yearPdfSubtitle}>Yearly paid list for {year}</Text>
                    </View>
                    <Text style={styles.yearPdfChevron}>›</Text>
                  </Pressable>

                  <View style={styles.historySummaryRow}>
                    <View style={styles.historySummaryCard}>
                      <Text style={styles.historySummaryNumber}>{activeBills.length}</Text>
                      <Text style={styles.historySummaryLabel}>ACTIVE</Text>
                    </View>
                    <View style={styles.historySummaryCard}>
                      <Text style={styles.historySummaryNumber}>{archivedBills.length}</Text>
                      <Text style={styles.historySummaryLabel}>HISTORY</Text>
                    </View>
                    <View style={styles.historySummaryCard}>
                      <Text style={styles.historySummaryNumber}>₹{yearBills.reduce((sum, item) => sum + Number(item.amount || 0), 0).toFixed(0)}</Text>
                      <Text style={styles.historySummaryLabel}>TOTAL BILLED</Text>
                    </View>
                  </View>

                  {activeBills.length ? (
                    <>
                      <View style={styles.listSubHeader}>
                        <Text style={styles.listSubHeaderTitle}>ACTIVE BILLS</Text>
                        <Text style={styles.listSubHeaderCount}>{activeBills.length}</Text>
                      </View>
                      {activeBills.map((bill) => renderBillCard(bill, false))}
                    </>
                  ) : (
                    <View style={styles.miniEmpty}>
                      <Text style={styles.miniEmptyTitle}>No active bills</Text>
                      <Text style={styles.miniEmptyText}>All {year} bills are currently in Bill History.</Text>
                    </View>
                  )}

                  {archivedBills.length ? (
                    <View style={styles.archiveSection}>
                      <View style={styles.archiveHeader}>
                        <View style={styles.archiveHeaderLeft}>
                          <View style={styles.archiveHeaderIcon}><Text style={styles.archiveHeaderIconText}>✓</Text></View>
                          <View>
                            <Text style={styles.archiveTitle}>BILL HISTORY</Text>
                            <Text style={styles.archiveSubtitle}>{year} payment information</Text>
                          </View>
                        </View>
                        <View style={styles.archiveCount}><Text style={styles.archiveCountText}>{archivedBills.length}</Text></View>
                      </View>
                      {archivedBills.map((bill) => renderBillCard(bill, true))}
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          );
        })}

        {!groupedBills.length ? <View style={styles.empty}><Text style={styles.emptyTitle}>No Chhiatni Fund years found</Text><Text style={styles.description}>Create a billing year above and that year will remain in Admin History.</Text></View> : null}
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BG },
  loadingText: { marginTop: 12, color: MUTED, fontSize: 12 },
  denied: { color: RED, fontSize: 20, fontWeight: '900' },
  header: { paddingTop: 55, paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  eyebrow: { color: '#FFDADA', fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: WHITE, fontSize: 26, fontWeight: '900', marginTop: 2 },
  subtitle: { color: '#EEEEEE', fontSize: 11, marginTop: 4 },
  close: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  closeText: { color: WHITE, fontSize: 28, fontWeight: '300', marginTop: -3 },
  content: { padding: 16, paddingBottom: 40 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  summaryCard: { width: '48%', minHeight: 82, backgroundColor: WHITE, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 14 },
  summaryNumber: { color: RED, fontSize: 20, fontWeight: '900' },
  summaryLabel: { color: MUTED, fontSize: 9, fontWeight: '800', marginTop: 4 },
  formCard: { backgroundColor: WHITE, borderRadius: 19, borderWidth: 1, borderColor: BORDER, padding: 16, marginBottom: 14 },
  formTitle: { color: TEXT, fontSize: 16, fontWeight: '900', marginBottom: 5 },
  description: { color: MUTED, fontSize: 10, lineHeight: 15, marginBottom: 10 },
  label: { color: MUTED, fontSize: 8, fontWeight: '900', letterSpacing: 0.8, marginTop: 7, marginBottom: 5 },
  input: { minHeight: 46, borderWidth: 1, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 12, color: TEXT, backgroundColor: '#FAFAFA', fontSize: 12 },
  textArea: { minHeight: 78, paddingTop: 12, textAlignVertical: 'top' },
  qr: { width: 180, height: 180, alignSelf: 'center', marginVertical: 10 },
  memberPickerHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 2, marginBottom: 7 },
  selectedCount: { color: RED, fontSize: 11, fontWeight: '900', marginTop: -1 },
  selectAllButton: { minHeight: 34, borderRadius: 10, borderWidth: 1, borderColor: '#E7C7C7', backgroundColor: '#FFF7F7', paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  selectAllButtonText: { color: RED, fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  memberPickerList: { maxHeight: 270, borderWidth: 1, borderColor: BORDER, borderRadius: 14, overflow: 'hidden', backgroundColor: '#FAFAFA', marginBottom: 8 },
  memberPickerItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#EEEEEE', backgroundColor: WHITE },
  memberPickerItemSelected: { backgroundColor: '#FFF6F6' },
  memberCheck: { width: 26, height: 26, borderRadius: 8, borderWidth: 1.5, borderColor: '#CFCFCF', backgroundColor: WHITE, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  memberCheckSelected: { backgroundColor: RED, borderColor: RED },
  memberCheckText: { color: WHITE, fontSize: 13, fontWeight: '900' },
  memberPickerName: { color: TEXT, fontSize: 11, fontWeight: '900' },
  memberPickerMeta: { color: MUTED, fontSize: 8.5, marginTop: 3 },
  memberPickerEmpty: { padding: 18, alignItems: 'center' },
  memberPickerEmptyText: { color: MUTED, fontSize: 10 },
  primary: { minHeight: 46, borderRadius: 13, backgroundColor: RED, alignItems: 'center', justifyContent: 'center', marginTop: 12, paddingHorizontal: 14 },
  primaryDisabled: { backgroundColor: '#BDBDBD' },
  primaryText: { color: WHITE, fontSize: 10, fontWeight: '900', letterSpacing: 0.5, textAlign: 'center' },
  outline: { minHeight: 44, borderRadius: 13, borderWidth: 1, borderColor: RED, alignItems: 'center', justifyContent: 'center', marginTop: 9 },
  outlineText: { color: RED, fontSize: 10, fontWeight: '900' },
  hero: { minHeight: 125, borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  heroEyebrow: { color: '#FFDADA', fontSize: 8, fontWeight: '900', letterSpacing: 1.3 },
  heroAmount: { color: WHITE, fontSize: 29, fontWeight: '900', marginTop: 3 },
  heroMeta: { color: '#EEEEEE', fontSize: 10, marginTop: 3 },
  heroIcon: { fontSize: 38 },
  listHeader: { marginTop: 4, marginBottom: 8 },
  sectionTitle: { color: TEXT, fontSize: 18, fontWeight: '900' },
  yearSection: { marginBottom: 14 },
  yearHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: WHITE, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 13, marginBottom: 9 },
  yearHeaderPressed: { opacity: 0.82, transform: [{ scale: 0.995 }] },
  yearChevron: { color: RED, fontSize: 30, fontWeight: '300', marginLeft: 10, marginRight: 2 },
  yearDetailPanel: { backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: BORDER, padding: 14, marginTop: -1, marginBottom: 12 },
  yearDetailTop: { flexDirection: 'row', alignItems: 'center', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  yearDetailEyebrow: { color: RED, fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  yearDetailTitle: { color: TEXT, fontSize: 19, fontWeight: '900', marginTop: 2 },
  yearDetailSubtitle: { color: MUTED, fontSize: 9, marginTop: 3 },
  yearPdfButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: WHITE, borderRadius: 16, borderWidth: 1, borderColor: '#E7C7C7', padding: 13, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  yearPdfButtonPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  yearPdfIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: RED, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  yearPdfIconText: { color: WHITE, fontSize: 11, fontWeight: '900', letterSpacing: 0.4 },
  yearPdfTitle: { color: TEXT, fontSize: 11, fontWeight: '900', letterSpacing: 0.6 },
  yearPdfSubtitle: { color: MUTED, fontSize: 9, marginTop: 4 },
  yearPdfChevron: { color: RED, fontSize: 25, fontWeight: '700', marginLeft: 10 },
  historySummaryRow: { flexDirection: 'row', gap: 8, marginVertical: 12 },
  historySummaryCard: { flex: 1, backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 10 },
  historySummaryNumber: { color: RED, fontSize: 15, fontWeight: '900' },
  historySummaryLabel: { color: MUTED, fontSize: 7, fontWeight: '900', letterSpacing: 0.8, marginTop: 3 },
  yearBadge: { width: 48, height: 48, borderRadius: 14, backgroundColor: RED, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  yearBadgeText: { color: WHITE, fontSize: 12, fontWeight: '900' },
  yearTitle: { color: TEXT, fontSize: 15, fontWeight: '900' },
  yearMeta: { color: MUTED, fontSize: 9, fontWeight: '700', marginTop: 3 },
  search: { minHeight: 44, backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 12, color: TEXT, fontSize: 11, marginBottom: 10 },
  billCard: { backgroundColor: WHITE, borderRadius: 18, borderWidth: 1, borderColor: BORDER, padding: 15, marginBottom: 10 },
  billTop: { flexDirection: 'row', alignItems: 'center' },
  billIcon: { width: 45, height: 45, borderRadius: 14, backgroundColor: LIGHT_RED, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  billIconText: { fontSize: 20 },
  billHouse: { color: TEXT, fontSize: 14, fontWeight: '900' },
  billMeta: { color: MUTED, fontSize: 9, marginTop: 3 },
  badge: { backgroundColor: LIGHT_RED, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6 },
  badgePaid: { backgroundColor: '#E8F5E9' },
  badgeText: { color: RED, fontSize: 8, fontWeight: '900' },
  badgePaidText: { color: '#2E7D32' },
  badgePending: { backgroundColor: '#FFF3E0' },
  badgePendingText: { color: '#EF6C00' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: BORDER, marginTop: 13, paddingTop: 12 },
  detailLabel: { color: MUTED, fontSize: 7, fontWeight: '900', letterSpacing: 0.8 },
  amountText: { color: RED, fontSize: 17, fontWeight: '900', marginTop: 3 },
  detailValue: { color: TEXT, fontSize: 11, fontWeight: '800', marginTop: 5 },
  paymentInfo: { backgroundColor: '#E8F5E9', borderRadius: 9, padding: 9, marginTop: 10 },
  paymentInfoText: { color: '#2E7D32', fontSize: 9, fontWeight: '700' },
  paymentInfoCard: { backgroundColor: '#F8FAF8', borderRadius: 12, borderWidth: 1, borderColor: '#DCE8DE', padding: 11, marginTop: 11 },
  paymentInfoTitle: { color: '#2E7D32', fontSize: 8, fontWeight: '900', letterSpacing: 0.9, marginBottom: 9 },
  paymentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  paymentField: { minWidth: '45%', flexGrow: 1 },
  paymentFieldLabel: { color: MUTED, fontSize: 7, fontWeight: '900', letterSpacing: 0.65 },
  paymentFieldValue: { color: TEXT, fontSize: 9, fontWeight: '800', marginTop: 3 },
  publishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  publishTitle: { color: TEXT, fontSize: 11, fontWeight: '900' },
  publishHint: { color: MUTED, fontSize: 9, marginTop: 2 },
  publishButton: {
    minWidth: 82,
    minHeight: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  publishButtonVisible: { backgroundColor: '#C62828' },
  publishButtonHidden: { backgroundColor: '#2E7D32' },
  publishButtonText: { color: WHITE, fontSize: 9, fontWeight: '900' },

  listSubHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 7, marginTop: 2 },
  listSubHeaderTitle: { color: MUTED, fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  listSubHeaderCount: { color: RED, fontSize: 9, fontWeight: '900' },
  miniEmpty: { backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: BORDER, borderRadius: 14, padding: 14, marginBottom: 10 },
  miniEmptyTitle: { color: TEXT, fontSize: 11, fontWeight: '900' },
  miniEmptyText: { color: MUTED, fontSize: 9, marginTop: 3 },
  archiveSection: { marginTop: 12, borderRadius: 18, borderWidth: 1, borderColor: '#DCE8DE', backgroundColor: '#F7FBF7', padding: 10 },
  archiveHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, paddingBottom: 9 },
  archiveHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  archiveHeaderIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#2E7D32', alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  archiveHeaderIconText: { color: WHITE, fontSize: 16, fontWeight: '900' },
  archiveTitle: { color: '#2E7D32', fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  archiveSubtitle: { color: MUTED, fontSize: 8, marginTop: 2 },
  archiveCount: { minWidth: 28, height: 28, borderRadius: 9, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7 },
  archiveCountText: { color: '#2E7D32', fontSize: 9, fontWeight: '900' },
  archivedBillCard: { borderColor: '#DCE8DE', backgroundColor: WHITE },
  archiveIcon: { backgroundColor: '#E8F5E9' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  action: { flex: 1, minHeight: 40, borderRadius: 11, backgroundColor: RED, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7 },
  actionText: { color: WHITE, fontSize: 8, fontWeight: '900', textAlign: 'center' },
  delete: { backgroundColor: WHITE, borderWidth: 1, borderColor: '#D32F2F' },
  deleteText: { color: '#D32F2F' },
  cashAction: { backgroundColor: '#2E7D32' },
  empty: { backgroundColor: WHITE, borderRadius: 18, borderWidth: 1, borderColor: BORDER, padding: 25, alignItems: 'center' },
  emptyTitle: { color: TEXT, fontSize: 15, fontWeight: '900', marginBottom: 5 },
});
