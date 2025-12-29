type ConnectionStatus = "idle" | "connecting" | "connected";

interface ConnectionIndicatorProps {
  status: ConnectionStatus;
}

export function ConnectionIndicator({ status }: ConnectionIndicatorProps) {
  const isConnecting = status === "connecting";
  const isConnected = status === "connected";

  return (
    <div className="flex items-center gap-2 text-sm font-medium">
      {/* Status dot */}
      <span
        className={[
          "w-3 h-3 rounded-full transition-colors",
          isConnected
            ? "bg-green-500"
            : "bg-red-500 animate-pulse",
        ].join(" ")}
      />

      {/* Status text */}
      <span className="text-white/80">
        {isConnected ? "Connected" : "Loading..."}
      </span>
    </div>
  );
}
