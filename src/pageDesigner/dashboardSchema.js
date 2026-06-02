// 销售数据仪表盘 amis schema
// 复刻参考图示中的风格与内容

export function dashboardSchema() {
  return {
    type: 'page',
    title: '销售数据仪表盘',
    body: [
      // ===== 顶部 4 个 KPI 卡片 =====
      {
        type: 'grid',
        gap: 12,
        columns: [
          {
            column: 3,
            body: [
              {
                type: 'panel',
                title: '总销售额',
                body: [
                  {
                    type: 'tpl',
                    tpl: '<div style="font-size:28px;font-weight:600;color:#333;">¥126560</div><div style="font-size:12px;color:#86909c;margin-top:8px;">周同比 12.00% <span style="color:#4CAF50;">▲</span>&nbsp;&nbsp;日同比 11.00% <span style="color:#F44336;">▼</span></div><div style="font-size:12px;color:#86909c;margin-top:4px;">日均销售额 ¥234.56</div>',
                  },
                ],
              },
            ],
          },
          {
            column: 3,
            body: [
              {
                type: 'panel',
                title: '订单量',
                body: [
                  {
                    type: 'tpl',
                    tpl: '<div style="font-size:28px;font-weight:600;color:#333;">8846</div>',
                  },
                  {
                    type: 'chart',
                    height: 80,
                    config: {
                      tooltip: { trigger: 'axis' },
                      grid: { left: 0, right: 0, top: 5, bottom: 5, containLabel: false },
                      xAxis: { show: false, type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
                      yAxis: { show: false, type: 'value' },
                      series: [
                        {
                          type: 'line',
                          data: [820, 932, 901, 934, 1290, 1330, 1320],
                          smooth: true,
                          areaStyle: { opacity: 0.3, color: '#0091FF' },
                          lineStyle: { color: '#0091FF', width: 2 },
                          itemStyle: { color: '#0091FF' },
                          symbol: 'none',
                        },
                      ],
                    },
                  },
                  {
                    type: 'tpl',
                    tpl: '<div style="font-size:12px;color:#86909c;">日订单量 1234</div>',
                  },
                ],
              },
            ],
          },
          {
            column: 3,
            body: [
              {
                type: 'panel',
                title: '支付笔数',
                body: [
                  {
                    type: 'tpl',
                    tpl: '<div style="font-size:28px;font-weight:600;color:#333;">6560</div>',
                  },
                  {
                    type: 'chart',
                    height: 80,
                    config: {
                      tooltip: { trigger: 'axis' },
                      grid: { left: 0, right: 0, top: 5, bottom: 5, containLabel: false },
                      xAxis: { show: false, type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
                      yAxis: { show: false, type: 'value' },
                      series: [
                        {
                          type: 'bar',
                          data: [120, 200, 150, 80, 170],
                          barWidth: 12,
                          itemStyle: { color: '#0091FF', borderRadius: [3, 3, 0, 0] },
                        },
                      ],
                    },
                  },
                  {
                    type: 'tpl',
                    tpl: '<div style="font-size:12px;color:#86909c;">转化率 60%</div>',
                  },
                ],
              },
            ],
          },
          {
            column: 3,
            body: [
              {
                type: 'panel',
                title: '运营活动效果',
                body: [
                  {
                    type: 'tpl',
                    tpl: '<div style="font-size:28px;font-weight:600;color:#333;">78%</div><div style="margin-top:8px;background:#e8e8e8;border-radius:4px;height:8px;overflow:hidden;"><div style="background:#0091FF;height:100%;width:78%;border-radius:4px;"></div></div><div style="font-size:12px;color:#86909c;margin-top:8px;">周同比 12.00% <span style="color:#4CAF50;">▲</span>&nbsp;&nbsp;日同比 11.00% <span style="color:#F44336;">▼</span></div>',
                  },
                ],
              },
            ],
          },
        ],
      },

      // ===== 中部：销售额柱状图 + 门店排行 =====
      {
        type: 'grid',
        gap: 12,
        columns: [
          {
            column: 8,
            body: [
              {
                type: 'panel',
                title: '销售额',
                body: [
                  {
                    type: 'chart',
                    height: 350,
                    config: {
                      tooltip: { trigger: 'axis' },
                      grid: { left: 60, right: 20, top: 20, bottom: 40 },
                      xAxis: {
                        type: 'category',
                        data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
                        axisLabel: { color: '#86909c' },
                        axisLine: { lineStyle: { color: '#eef0f3' } },
                      },
                      yAxis: {
                        type: 'value',
                        max: 1200,
                        axisLabel: { color: '#86909c' },
                        splitLine: { lineStyle: { color: '#eef0f3' } },
                      },
                      series: [
                        {
                          type: 'bar',
                          data: [700, 720, 1150, 230, 1160, 900, 1080, 880, 450, 880, 520, 1180],
                          barWidth: 24,
                          itemStyle: { color: '#0091FF', borderRadius: [4, 4, 0, 0] },
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
          {
            column: 4,
            body: [
              {
                type: 'panel',
                title: '门店销售排行榜',
                body: [
                  {
                    type: 'tpl',
                    tpl: rankingTpl(),
                  },
                ],
              },
            ],
          },
        ],
      },

      // ===== 底部：访问量统计 + 折线图 =====
      {
        type: 'panel',
        title: '最近一周访问量统计',
        body: [
          {
            type: 'grid',
            gap: 12,
            columns: [
              {
                column: 4,
                body: [
                  {
                    type: 'tpl',
                    tpl: '<div style="text-align:center;padding:16px 0;"><div style="font-size:12px;color:#86909c;">📍 今日IP</div><div style="font-size:24px;font-weight:600;color:#0091FF;margin-top:4px;">3</div></div>',
                  },
                ],
              },
              {
                column: 4,
                body: [
                  {
                    type: 'tpl',
                    tpl: '<div style="text-align:center;padding:16px 0;"><div style="font-size:12px;color:#86909c;">👤 今日访问</div><div style="font-size:24px;font-weight:600;color:#4CAF50;margin-top:4px;">32</div></div>',
                  },
                ],
              },
              {
                column: 4,
                body: [
                  {
                    type: 'tpl',
                    tpl: '<div style="text-align:center;padding:16px 0;"><div style="font-size:12px;color:#86909c;">📈 总访问量</div><div style="font-size:24px;font-weight:600;color:#0091FF;margin-top:4px;">2356</div></div>',
                  },
                ],
              },
            ],
          },
          {
            type: 'chart',
            height: 200,
            config: {
              tooltip: { trigger: 'axis' },
              grid: { left: 40, right: 20, top: 20, bottom: 30 },
              xAxis: {
                type: 'category',
                data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
                axisLabel: { color: '#86909c' },
                axisLine: { lineStyle: { color: '#eef0f3' } },
              },
              yAxis: {
                type: 'value',
                min: 40,
                max: 120,
                axisLabel: { color: '#86909c' },
                splitLine: { lineStyle: { color: '#eef0f3' } },
              },
              series: [
                {
                  type: 'line',
                  data: [55, 70, 85, 110, 95, 90, 58],
                  smooth: true,
                  lineStyle: { color: '#4CAF50', width: 2 },
                  itemStyle: { color: '#4CAF50' },
                  areaStyle: { opacity: 0.15, color: '#4CAF50' },
                },
              ],
            },
          },
        ],
      },
    ],
  };
}

// 门店排行模板
function rankingTpl() {
  const stores = [
    { rank: 1, name: '白鹭岛1号店', value: '1234.56', top: true },
    { rank: 2, name: '白鹭岛2号店', value: '1134.56', top: true },
    { rank: 3, name: '白鹭岛3号店', value: '1034.56', top: true },
    { rank: 4, name: '白鹭岛4号店', value: '934.56', top: false },
    { rank: 5, name: '白鹭岛5号店', value: '834.56', top: false },
    { rank: 6, name: '白鹭岛6号店', value: '734.56', top: false },
    { rank: 7, name: '白鹭岛7号店', value: '634.56', top: false },
  ];
  return stores
    .map((s, i) => {
      const bg = s.top ? '#0091FF' : '#e8e8e8';
      const fg = s.top ? '#fff' : '#333';
      const border = i < stores.length - 1 ? 'border-bottom:1px solid #f0f0f0;' : '';
      return `<div style="display:flex;justify-content:space-between;padding:8px 0;${border}"><div><span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:${bg};color:${fg};text-align:center;line-height:20px;font-size:12px;">${s.rank}</span>&nbsp;${s.name}</div><div style="font-weight:600;">${s.value}</div></div>`;
    })
    .join('');
}