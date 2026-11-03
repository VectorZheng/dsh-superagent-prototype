# Changelog

## Unreleased

### Fixed

- Settings no longer covers the page tabs. The host pane stays locked (`.dt-page` does not scroll); the header and the Overview / Source / Trigger / Eval / Execution / Settings tabs stay in view. The settings group list (来源 / 评估 / 执行 / 提示词 / 部署) is outside the form scroller, so opening 评估 or 提示词 cannot slide that list over the tabs or over 服务商 / 模型. The form scrolls in `.dt-settings-body`, and each group opens at the top of that body.

Bot: Frontend · 前端
