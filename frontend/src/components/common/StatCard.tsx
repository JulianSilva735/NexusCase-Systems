import { Box, Paper, Typography } from '@mui/material';
import { Warning } from '@mui/icons-material';

interface StatCardProps {
    title: string;
    value: number | string;
    subtitle?: string;
    color: string;
    onClick?: () => void;
    isClickable?: boolean;
}

export const StatCard = ({ title, value, subtitle, color, onClick, isClickable }: StatCardProps) => (
    <Paper
        elevation={0}
        onClick={isClickable ? onClick : undefined}
        sx={{
            p: 2,
            border: '1px solid #e0e0e0',
            borderLeft: `6px solid ${color}`,
            height: '100%',
            transition: 'all 0.2s',
            cursor: isClickable ? 'pointer' : 'default',
            '&:hover': isClickable ? { transform: 'translateY(-2px)', boxShadow: 3 } : {}
        }}
    >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
                <Typography variant="body2" color="text.secondary" fontWeight="bold" gutterBottom>{title}</Typography>
                <Typography variant="h3" fontWeight="bold" sx={{ mb: 1, color: '#1e293b' }}>{value}</Typography>
            </Box>
            {color === '#ef4444' && Number(value) > 0 && <Warning color="error" fontSize="large" sx={{ opacity: 0.2 }} />}
        </Box>

        {subtitle && (
            <Typography variant="caption" sx={{ color: color === '#ef4444' ? 'error.main' : 'text.secondary', bgcolor: '#f1f5f9', px: 1, py: 0.5, borderRadius: 1 }}>
                {subtitle}
            </Typography>
        )}
    </Paper>
);
