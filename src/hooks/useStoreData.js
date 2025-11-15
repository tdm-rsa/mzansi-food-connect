import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export function useStoreData(ownerId = null) {
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Fetch store data (by ownerId or current session user)
  async function fetchStore() {
    try {
      setLoading(true);

      let effectiveOwnerId = ownerId;

      // If ownerId not provided, resolve from current session
      if (!effectiveOwnerId) {
        const { data: sessionData, error: sessionErr } =
          await supabase.auth.getSession();
        if (sessionErr) throw sessionErr;
        effectiveOwnerId = sessionData?.session?.user?.id || null;
      }

      // If we still don't have an owner id, bail gracefully
      if (!effectiveOwnerId) {
        setStore(null);
        setLoading(false);
        return;
      }

      const { data, error} = await supabase
        .from("tenants")
        .select("*")
        .eq("owner_id", effectiveOwnerId)
        .limit(1);

      console.log("📊 useStoreData fetch - owner:", effectiveOwnerId);
      console.log("📊 useStoreData fetch - data:", data);
      console.log("📊 useStoreData fetch - error:", error);

      if (error) throw error;
      
      // If we have data, use the first store
      if (data && data.length > 0) {
        setStore(data[0]);
      } else {
        setStore(null);
      }
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err.message);
      setError(err.message);
      setStore(null);
    } finally {
      setLoading(false);
    }
  }

  // ✅ Update store settings
  async function updateStore(updates) {
    if (!store?.id) return;
    try {
      // Optimistically update local state first
      const optimisticStore = { ...store, ...updates };
      setStore(optimisticStore);
      
      const { data, error } = await supabase
        .from("tenants")
        .update(updates)
        .eq("id", store.id)
        .select()
        .single();

      if (error) {
        // If it's just the updated_at column missing, ignore it
        if (error.message?.includes('updated_at') || error.code === '42703') {
          console.warn('updated_at column missing - optimistic update applied');
          setError(null);
          return; // Keep optimistic update
        }
        throw error;
      }
      
      setStore(data); // reflect latest saved state from DB
      setError(null);
    } catch (err) {
      console.error("Update error:", err.message);
      setError(err.message);
      // Revert optimistic update on real error
      fetchStore();
    }
  }

  // ✅ Initial fetch (when ownerId changes)
  useEffect(() => {
    fetchStore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId]);

  // ✅ Realtime subscription for live changes (resubscribe when store.id is known)
  useEffect(() => {
    if (!store?.id) return;

    const channel = supabase
      .channel("stores-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "stores", filter: `id=eq.${store.id}` },
        (payload) => {
          // Apply incoming row changes to local state
          if (payload?.new?.id === store.id) {
            setStore(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (_) {
        // no-op
      }
    };
  }, [store?.id]);

  return { store, loading, error, fetchStore, updateStore };
}
