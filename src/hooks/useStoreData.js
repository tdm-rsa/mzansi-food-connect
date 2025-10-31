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

      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("owner_id", effectiveOwnerId)
        .limit(1);

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
      const { data, error } = await supabase
        .from("stores")
        .update(updates)
        .eq("id", store.id)
        .select()
        .single();

      if (error) throw error;
      setStore(data); // reflect latest saved state
      setError(null);
    } catch (err) {
      console.error("Update error:", err.message);
      setError(err.message);
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
