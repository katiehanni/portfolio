import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const numberFormatter = new Intl.NumberFormat('en-US');
const percentageFormatter = d3.format('.1~%');

let commits = [];
let codeLines = [];
let xScale;
let yScale;

async function loadData() {
  try {
    const csv = await d3.csv(
      'loc.csv',
      (row) =>
        row && {
          ...row,
          line: Number(row.line),
          depth: Number(row.depth),
          length: Number(row.length),
          date:
            row.date && row.timezone
              ? new Date(`${row.date}T00:00${row.timezone}`)
              : row.date
                ? new Date(row.date)
                : undefined,
          datetime: row.datetime ? new Date(row.datetime) : undefined,
        },
    );
    return csv.filter((d) => d && !Number.isNaN(d.line));
  } catch (error) {
    console.error('Failed to load loc.csv', error);
    renderStatsError();
    return [];
  }
}

function renderStatsError() {
  const stats = d3.select('#stats');
  stats.selectAll('*').remove();
  stats
    .append('div')
    .attr('class', 'meta-placeholder')
    .html(
      [
        'Unable to load <code>meta/loc.csv</code>.',
        'Run <code>npm install elocuent -D</code> then <code>npx elocuent -d . -o meta/loc.csv --spaces 2</code> to generate it.',
      ].join(' '),
    );
}

function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      const first = lines[0];
      const {
        author = 'Unknown author',
        date,
        time,
        timezone = '',
        datetime,
      } = first ?? {};

      const datetimeValue = datetime instanceof Date ? datetime : new Date();

      const result = {
        id: commit,
        url: `https://github.com/kathehann/portfolio/commit/${commit}`,
        author,
        date,
        time,
        timezone,
        datetime: datetimeValue,
        hourFrac:
          datetimeValue.getHours() + datetimeValue.getMinutes() / 60 || 0,
        totalLines: lines.length,
      };

      Object.defineProperty(result, 'lines', {
        value: lines,
        enumerable: false,
        configurable: false,
        writable: false,
      });

      return result;
    })
    .filter((d) => d.datetime instanceof Date && !Number.isNaN(d.hourFrac));
}

function renderCommitInfo(data, commitsData) {
  const container = d3.select('#stats');
  container.selectAll('*').remove();

  const dl = container.append('dl').attr('class', 'stats meta-stats');

  const addStat = (label, value) => {
    dl.append('dt').html(label);
    dl.append('dd').html(value);
  };

  addStat(
    'Total <abbr title="Lines of code">LOC</abbr>',
    numberFormatter.format(data.length),
  );

  addStat('Total commits', numberFormatter.format(commitsData.length));

  const filesGrouped = d3.groups(data, (d) => d.file);
  addStat('Files tracked', numberFormatter.format(filesGrouped.length));

  const fileLengths = d3.rollups(
    data,
    (values) => d3.max(values, (v) => v.line),
    (d) => d.file,
  );

  const longestFile = d3.greatest(fileLengths, (d) => d[1]);
  if (longestFile) {
    addStat(
      'Longest file',
      `${longestFile[0]} (${numberFormatter.format(longestFile[1])} lines)`,
    );
  }

  const averageFileLength = d3.mean(fileLengths, (d) => d[1]);
  if (!Number.isNaN(averageFileLength)) {
    addStat(
      'Average file length',
      `${numberFormatter.format(Math.round(averageFileLength))} lines`,
    );
  }

  const averageLineLength = d3.mean(data, (d) => d.length ?? 0);
  if (!Number.isNaN(averageLineLength)) {
    addStat(
      'Average line length',
      `${numberFormatter.format(Math.round(averageLineLength))} characters`,
    );
  }

  const deepestLine = d3.greatest(data, (d) => d.depth ?? -Infinity);
  if (deepestLine) {
    addStat(
      'Maximum depth',
      `${numberFormatter.format(deepestLine.depth)} (in ${deepestLine.file})`,
    );
  }

  const workByPeriod = d3.rollups(
    commitsData,
    (values) => d3.sum(values, (v) => v.totalLines),
    (d) => getDayPeriod(d.hourFrac),
  );
  const busiestPeriod = d3.greatest(workByPeriod, (d) => d[1]);
  if (busiestPeriod) {
    addStat(
      'Most active period',
      `${capitalize(busiestPeriod[0])} (${numberFormatter.format(busiestPeriod[1])} lines)`,
    );
  }

  const workByWeekday = d3.rollups(
    commitsData,
    (values) => d3.sum(values, (v) => v.totalLines),
    (d) =>
      d.datetime?.toLocaleDateString('en', {
        weekday: 'long',
      }) ?? 'Unknown',
  );
  const busiestDay = d3.greatest(workByWeekday, (d) => d[1]);
  if (busiestDay) {
    addStat(
      'Busiest weekday',
      `${busiestDay[0]} (${numberFormatter.format(busiestDay[1])} lines)`,
    );
  }
}

function getDayPeriod(hour) {
  if (Number.isNaN(hour)) return 'unknown';
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

function capitalize(value) {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function renderTooltipContent(commit) {
  if (!commit) return;

  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  const time = document.getElementById('commit-time');
  const author = document.getElementById('commit-author');
  const lines = document.getElementById('commit-lines');

  link.href = commit.url;
  link.textContent = commit.id;
  date.textContent = commit.datetime?.toLocaleString('en', {
    dateStyle: 'full',
  });
  time.textContent = commit.datetime?.toLocaleString('en', {
    timeStyle: 'short',
  });
  author.textContent = commit.author;
  lines.textContent = numberFormatter.format(commit.totalLines);
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  const offset = 16;
  const x = event.clientX + offset;
  const y = event.clientY + offset;
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
}

function isCommitSelected(selection, commit) {
  if (!selection || !commit) return false;
  const [[x0, y0], [x1, y1]] = selection;
  const x = xScale(commit.datetime);
  const y = yScale(commit.hourFrac);
  return x0 <= x && x <= x1 && y0 <= y && y <= y1;
}

function renderSelectionCount(selection) {
  const selected = selection
    ? commits.filter((commit) => isCommitSelected(selection, commit))
    : [];
  const countElement = document.querySelector('#selection-count');
  countElement.textContent = `${selected.length || 'No'} commits selected`;
  return selected;
}

function renderLanguageBreakdown(selection) {
  const container = document.getElementById('language-breakdown');
  container.innerHTML = '';

  const selectedCommits = selection
    ? commits.filter((commit) => isCommitSelected(selection, commit))
    : [];
  const sourceCommits = selectedCommits.length ? selectedCommits : commits;
  if (!sourceCommits.length) return;

  const lines = sourceCommits.flatMap((commit) => commit.lines ?? []);
  if (!lines.length) return;

  const breakdown = d3.rollups(
    lines,
    (values) => values.length,
    (d) => d.type ?? 'Unknown',
  );

  breakdown.sort((a, b) => d3.descending(a[1], b[1]));

  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const dt = document.createElement('dt');
    dt.textContent = language;

    const dd = document.createElement('dd');
    dd.textContent = `${numberFormatter.format(count)} lines (${percentageFormatter(proportion)})`;

    container.append(dt, dd);
  }
}

function renderScatterPlot(commitsData) {
  const width = 1000;
  const height = 600;
  const margin = { top: 16, right: 24, bottom: 48, left: 56 };

  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('role', 'img')
    .attr('aria-label', 'Scatter plot showing commits by date and time of day')
    .style('overflow', 'visible');

  const timeExtent = d3.extent(commitsData, (d) => d.datetime);

  xScale = d3
    .scaleTime()
    .domain(timeExtent)
    .range([usableArea.left, usableArea.right])
    .nice();

  yScale = d3
    .scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);

  const [minLines, maxLines] = d3.extent(commitsData, (d) => d.totalLines);
  const rScale = d3
    .scaleSqrt()
    .domain([Math.max(1, minLines || 1), Math.max(1, maxLines || 1)])
    .range([4, 28]);

  svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left},0)`)
    .call(
      d3
        .axisLeft(yScale)
        .tickFormat('')
        .tickSize(-usableArea.width)
        .ticks(8),
    );

  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => `${String(Math.floor(d) % 24).padStart(2, '0')}:00`)
    .ticks(12);

  svg
    .append('g')
    .attr('class', 'axis axis--x')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

  svg
    .append('g')
    .attr('class', 'axis axis--y')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);

  const dots = svg.append('g').attr('class', 'dots');

  const sortedCommits = d3.sort(commitsData, (d) => -d.totalLines);

  dots
    .selectAll('circle')
    .data(sortedCommits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .attr('fill-opacity', 0.6)
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).attr('fill-opacity', 0.95);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mousemove', (event) => {
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).attr('fill-opacity', 0.6);
      updateTooltipVisibility(false);
    });

  const brush = d3
    .brush()
    .extent([
      [usableArea.left, usableArea.top],
      [usableArea.right, usableArea.bottom],
    ])
    .on('start brush end', (event) => brushed(event, svg));

  svg.call(brush);
  svg.selectAll('.dots, .overlay ~ *').raise();
}

function brushed(event, svg) {
  const selection = event.selection;

  svg
    .selectAll('.dots circle')
    .classed('selected', (d) => isCommitSelected(selection, d));

  renderSelectionCount(selection);
  renderLanguageBreakdown(selection);
}

(async function init() {
  codeLines = await loadData();
  if (!codeLines.length) {
    return;
  }

  commits = processCommits(codeLines);

  if (!commits.length) {
    renderStatsError();
    return;
  }

  renderCommitInfo(codeLines, commits);
  renderScatterPlot(commits);
  renderSelectionCount(null);
  renderLanguageBreakdown(null);
})().catch((error) => {
  console.error('Failed to initialize meta analysis', error);
  renderStatsError();
});

