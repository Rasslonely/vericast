/**
 * VERICAST OMEGA — Frontend TypeScript Interfaces
 * Traceable to: SYSTEM_INTERFACES_internal.md §5
 */

export interface VerifiedResponse {
    key: string;
    da_root: string;
    tee_seal: string | null;
    explorer_link: string | null;
}

export interface DePINResponse extends VerifiedResponse {}

export interface GameTickResponse extends VerifiedResponse {
    state_root: string;
}

export interface SocialAuditResponse {
    feed_id: string;
    flagged_agents: string[];
    tee_seal: string | null;
    summary: string;
}

export interface HealthResponse {
    status: 'healthy' | 'degraded';
    '0g_kv': boolean;
    '0g_tee': boolean;
    '0g_da': boolean;
    integrations_verified: boolean;
}

export interface APIError {
    error: 'rate_limit' | 'upstream_timeout' | 'tee_unavailable' | 'validation_error';
    component?: string;
    source?: string;
    retry_after?: number;
    fallback_used?: boolean;
    fallback?: string;
    message: string;
}

export interface PanelProps {
    api: string;
    explorer: string;
    onActivity?: () => void;
}

export interface VericastBadgeProps {
    count: number;
    health: HealthResponse | null;
}

export interface PlayerState {
    id: string;
    x: number;
    y: number;
    health: number;
}

export interface TickData {
    match_id: string;
    tick: number;
    players: PlayerState[];
    timestamp: number;
    object_count: number;
}

export interface DeploymentJSON {
    network: string;
    chainId: number;
    timestamp: string;
    deployer: string;
    contracts: {
        VERI: string;
        VericastArbiter: string;
        VericastAgentID: string;
    };
    explorer: {
        VERI: string;
        VericastArbiter: string;
        VericastAgentID: string;
    };
}
