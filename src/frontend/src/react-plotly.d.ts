declare module 'react-plotly.js' {
    import * as Plotly from 'plotly.js';
    import * as React from 'react';

    interface PlotParams {
        data: Plotly.Data[];
        layout?: Partial<Plotly.Layout>;
        frames?: Partial<Plotly.Frame>[];
        config?: Partial<Plotly.Config>;
        onClick?: (event: Plotly.PlotMouseEvent) => void;
        onHover?: (event: Plotly.PlotMouseEvent) => void;
        onUnHover?: (event: Plotly.PlotMouseEvent) => void;
        onSelected?: (event: Plotly.PlotSelectionEvent) => void;
        onRelayout?: (event: Plotly.PlotRelayoutEvent) => void;
        onLegendClick?: (event: Plotly.LegendClickEvent) => boolean;
        style?: React.CSSProperties;
        className?: string;
    }

    class Plot extends React.Component<PlotParams> {}
    export default Plot;
}