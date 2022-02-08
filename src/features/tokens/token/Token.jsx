import { makeStyles } from "@material-ui/core"
import { useCallback, useEffect, useState, useRef } from "react"
import { useHistory, useParams } from "react-router-dom"
import ButtonGroup from "../../../components/buttonGroup/ButtonGroup"
import ContainerLoader from "../../../components/loader/ContainerLoader"
import Paper from "../../../components/paper/Paper"
import { useTokens } from "../../../contexts/TokensProvider"
import {
	detectBestDecimalsDisplay,
	formatDate,
	formatDateHours,
	formateNumberPrice,
	formateNumberPriceDecimals,
	formaterNumber,
	getDates,
	getInclude,
	twoNumber,
} from "../../../helpers/helpers"
import TokenChartPrice from "./TokenChartPrice"
import TokenLiquidityChart from "./TokenLiquidityChart"
import TokenPath from "./TokenPath"
import TokenTitle from "./TokenTitle"
import TokenVolumeChart from "./TokenVolumeChart"
import { CSSTransitionGroup } from "react-transition-group"

const useStyles = makeStyles((theme) => {
	return {
		tokenRoot: {
			display: "grid",
			gridAutoRows: "auto",
			rowGap: theme.spacing(2),
		},
		charts: {
			display: "grid",
			gridTemplateColumns: "300px 1fr",
			gap: theme.spacing(1),

			[theme.breakpoints.down("xs")]: {
				gridTemplateColumns: "1fr",
				gridTemplateRows: "1fr 1fr",
			},
		},
		right: {
			zIndex: "0",
			height: "100%",
			[theme.breakpoints.down("xs")]: {
				width: "100%",
			},
		},
		chart: {
			width: "100%",
			height: "80%",
		},
		textBig: {
			fontSize: theme.fontSize.big,
			color: theme.palette.gray.contrastText,
			fontVariantNumeric: "tabular-nums",
		},
		details: {
			display: "flex",
			flexDirection: "column",
			minHeight: "350px",
			[theme.breakpoints.down("xs")]: {
				width: "100%",
			},
		},
		detail: {
			padding: theme.spacing(2),
		},
		dataDetail: {
			fontSize: theme.fontSize.big,
			color: theme.palette.gray.contrastText,
		},
		titleDetail: {
			fontWeight: "600",
		},
		tokenPrice: {
			fontWeight: "500",
			fontSize: "36px",
			paddingLeft: "10px",
			color: theme.palette.gray.contrastText,
		},
		groupButtons: {
			display: "flex",
			alignItems: "flex-end",
			flexDirection: "column",
			justifyContent: "flex-end",
			padding: theme.spacing(1),
		},
		groupButton: {
			marginBottom: theme.spacing(1),
		},
		chartHeader: {
			display: "flex",
			flexDirection: "row",
			justifyContent: "space-between",
			alignItems: "center",
		},
		containerErrorChart: {
			height: "100%",
			width: "100%",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
		},
		errorChart: {
			margin: "auto",
		},
		containerInfo: {
			display: "flex",
			flexDirection: "column",
			justifyContent: "space-around",
			minHeight: "180px",
		},
	}
})

const Token = ({ showToast }) => {
	const classes = useStyles()
	const history = useHistory()
	const { symbol } = useParams()
	const { getTokenData, getChartToken, tokens, getVolumeChartToken, getLiquidityChartToken } = useTokens()
	const [token, setToken] = useState({})
	const [dataChart, setDataChart] = useState([])
	const [savedData, setSavedData] = useState({})
	const [selectedRange, setSelectedRange] = useState("7d")
	const [selectTypeChart, setSelectTypeChart] = useState("price")
	const [dataHover, setDataHover] = useState({ price: "0", date: "-" })
	const [liquidity, setLiquidity] = useState([])
	const [volume, setVolume] = useState([])
	const priceDecimals = useRef(2)

	const [rangeVolume, setRangeVolume] = useState("d")

	const [loadingRateChart, setLoadingRateChart] = useState(true) // rate data is not loaded
	const [loadingTokenDetails, setLoadingTokenDetails] = useState(true) // rate data is not loaded
	const [loadingTokenInfo, setLoadingTokenInfo] = useState(true) // rate data is not loaded

	const dataClickVolume = useRef({ time: { day: 1, month: 1, year: 1 }, value: 0, clickedTwice: true })
	const volumeRef = useRef([])

	useEffect(() => {
		// get token from history state
		if (!symbol) {
			showToast({
				severity: "warning",
				text: "Token not find, you are redirected to tokens page.",
			})
			history.push("/tokens")
		} else {
			if (tokens.length > 0) {
				let indexToken = getInclude(tokens, (token) => token.symbol === symbol)
				if (indexToken >= 0) {
					setToken({ ...tokens[indexToken] })
				} else {
					showToast({
						severity: "warning",
						text: "Token not find, you are redirected to tokens page.",
					})
					history.push("/tokens")
				}
			}
		}
	}, [symbol, showToast, history, tokens])

	const getName = (chartType, range = "-") => {
		return chartType + "-" + range
	}

	useEffect(() => {
		// fetch token details from server
		const fetch = async () => {
			setLoadingRateChart(true)
			setLoadingTokenDetails(true)
			setLoadingTokenInfo(true)
			let tokenData = await getTokenData(token.symbol)
			try {
				let promises = [
					getChartToken({ symbol: token.symbol, range: "7d" }),
					getLiquidityChartToken({ symbol: token.symbol }),
					getVolumeChartToken({ symbol: token.symbol }),
				]
				let results = await Promise.all(promises)
				let priceData = results[0]
				let liquidityData = results[1]
				let volumeData = results[2]
				priceDecimals.current = priceData.length > 0 ? detectBestDecimalsDisplay(priceData[0].open) : 2
				setLiquidity(liquidityData)
				setVolume(volumeData)
				volumeRef.current = volumeData
				let name = getName("price", "7d")
				setToken({ ...tokenData, price: priceData[priceData.length - 1].close })
				setDataChart([...priceData])
				setSavedData((ps) => {
					return { ...ps, [name]: priceData }
				})
				setDataHover({
					price: formateNumberPriceDecimals(priceData[priceData.length - 1].close, priceDecimals.current),
					date: formatDateHours(new Date()),
				})
				setLoadingRateChart(false)
				setLoadingTokenDetails(false)
				setLoadingTokenInfo(false)
			} catch (error) {
				console.log("Token.jsx -> 130: error", error)
				setDataHover({
					price: "-",
					date: "-",
				})
				setLoadingRateChart(false)
				setLoadingTokenDetails(false)
				setLoadingTokenInfo(false)
			}
		}
		if (token.id) {
			fetch()
		}
	}, [token, getTokenData, getChartToken, getVolumeChartToken, getLiquidityChartToken])

	const crossMove = useCallback(
		(event, serie) => {
			if (selectTypeChart === "price") {
				if (event.time) {
					let price = formateNumberPriceDecimals(event.seriesPrices.get(serie).close, priceDecimals.current)
					let currentDate = new Date(event.time * 1000)
					setDataHover({ price, date: formatDateHours(currentDate) })
				}
			} else if (selectTypeChart === "volume") {
				if (event.time) {
					updateVolumeInfo(
						{
							time: new Date(`${event.time.year}-${event.time.month}-${event.time.day}`),
							value: event.seriesPrices.get(serie),
						},
						rangeVolume
					)
				}
			} else {
				if (event.time) {
					let price = "$" + formaterNumber(event.seriesPrices.get(serie), 2)
					let date = new Date(
						`${twoNumber(event.time.year)}/${twoNumber(event.time.month)}/${twoNumber(event.time.day)}`
					)
					setDataHover({ price, date: formatDate(date) })
				}
			}
		},
		[selectTypeChart, priceDecimals, rangeVolume]
	)

	const onChangeTypeChart = (value) => {
		setSelectTypeChart(value)
		if (value === "price") {
			updateDataChart(value, selectedRange)
		} else {
			updateDataChart(value)
		}
	}

	const onChangeRange = (value) => {
		setSelectedRange(value)
		updateDataChart(selectTypeChart, value)
	}

	const updateDataChart = async (typeChart, range = "-") => {
		let name = getName(typeChart, range)
		let loadDataSaved = savedData[name]
		if (loadDataSaved) {
			setDataChart(loadDataSaved)
			setDataHover({
				price: formateNumberPriceDecimals(loadDataSaved[loadDataSaved.length - 1].open, 2),
				date: formatDateHours(new Date()),
			})
		} else {
			if (typeChart === "price") {
				let chartData = await getChartToken({ symbol: token.symbol, range })
				setDataChart([...chartData])
				setSavedData((ps) => {
					return { ...ps, [name]: chartData }
				})
				setDataHover({
					price: formateNumberPriceDecimals(chartData[chartData.length - 1].open, priceDecimals.current),
					date: formatDateHours(new Date()),
				})
			}
			if (typeChart === "liquidity") {
				setDataHover({
					price: "$" + formaterNumber(liquidity[liquidity.length - 1].value, 2),
					date: formatDateHours(new Date()),
				})
			} else {
				if (volume.length > 0) {
					let lastElt = volume[volume.length - 1]
					let date = ""
					if (lastElt.time.year) {
						date = new Date(lastElt.time.year + "-" + twoNumber(lastElt.time.month) + "-" + twoNumber(lastElt.time.day))
					} else {
						date = new Date(lastElt.time)
					}
					updateVolumeInfo({ time: date, value: lastElt.value }, rangeVolume)
				}
			}
		}
	}

	const onChangeRangeVolume = async (value) => {
		let volume = await getVolumeChartToken({ symbol: token.symbol, range: value })
		console.log("Token.jsx -> 307: volume", volume)
		setRangeVolume(value)
		setVolume(volume)
		volumeRef.current = volume

		updateVolumeInfo(volume[volume.length - 1], value)
	}

	const updateVolumeInfo = (item, range) => {
		if (item && item.time) {
			let date = new Date(item.time)
			let price = "$" + formaterNumber(item.value, 2)
			let dateStr = formatDate(date)
			if (range && range != "d") {
				let dates = getDates(date, range)
				dateStr = `${formatDate(dates[0])} - ${formatDate(dates[1])}`
			}
			setDataHover({ price, date: dateStr })
		}
	}

	const onMouseLeaveVolume = (e) => {
		let value = volume[volume.length - 1]
		if (dataClickVolume.current.clickedTwice) {
			if (value.time) {
				updateVolumeInfo(
					{
						time: new Date(`${value.time.year}-${value.time.month}-${value.time.day}`),
						value: value.value,
					},
					rangeVolume
				)
			}
		} else {
			if (dataClickVolume.current.time) {
				updateVolumeInfo(
					{
						time: new Date(
							`${dataClickVolume.current.time.year}-${dataClickVolume.current.time.month}-${dataClickVolume.current.time.day}`
						),
						value: dataClickVolume.current.value,
					},
					rangeVolume
				)
			}
		}
	}

	const onMouseLeaveLiquidity = (e) => {
		let value = liquidity[liquidity.length - 1]
		if (value.time) {
			let price = "$" + formaterNumber(value.value, 2)
			setDataHover({ price, date: formatDate(new Date(`${value.time.year}-${value.time.month}-${value.time.day}`)) })
		}
	}

	const onClickChartVolume = (e) => {
		let index = getInclude(volumeRef.current, (item) => {
			return item.time.year === e.time.year && item.time.month === e.time.month && item.time.day === e.time.day
		})
		if (index > -1) {
			let same =
				e.time.year === dataClickVolume.current.time.year &&
				e.time.month === dataClickVolume.current.time.month &&
				e.time.day === dataClickVolume.current.time.day
			dataClickVolume.current = {
				time: volumeRef.current[index].time,
				value: volumeRef.current[index].value,
				clickedTwice: same ? !dataClickVolume.current.clickedTwice : false,
			}
		}
	}

	const onMouseLeavePrice = (e) => {
		let value = dataChart[dataChart.length - 1]
		console.log("Token.jsx -> 383: value", value  )
		if (value.time) {
			setDataHover({
				price: formateNumberPriceDecimals(value.close, priceDecimals.current),
				date: formatDateHours(new Date()),
			})
		}
	}

	let chartRender = (
		<div className={classes.containerErrorChart} key="noChart">
			<p className={classes.errorChart}>Not enough liquidity to display chart price.</p>
		</div>
	)

	if (selectTypeChart === "price" && dataChart.length > 0) {
		chartRender = (
			<TokenChartPrice
				onMouseLeave={onMouseLeavePrice}
				key={"TokenChartPrice" + selectedRange}
				data={dataChart}
				crossMove={crossMove}
			/>
		)
	} else if (selectTypeChart === "volume" && volume.length > 0) {
		chartRender = (
			<TokenVolumeChart
				onClick={onClickChartVolume}
				onMouseLeave={onMouseLeaveVolume}
				key={"TokenVolumeChart" + selectedRange}
				data={volume}
				crossMove={crossMove}
			/>
		)
	} else if (selectTypeChart === "liquidity" && liquidity.length > 0) {
		chartRender = (
			<TokenLiquidityChart
				onMouseLeave={onMouseLeaveLiquidity}
				key={"TokenLiquidityChart" + selectedRange}
				data={liquidity}
				crossMove={crossMove}
			/>
		)
	}
	return (
		<div className={classes.tokenRoot}>
			<ContainerLoader className={classes.containerInfo} isLoading={loadingTokenDetails}>
				<TokenPath token={token} />
				<TokenTitle token={token} />
				<p className={classes.tokenPrice}>{formateNumberPriceDecimals(token.price, priceDecimals.current)}</p>
			</ContainerLoader>
			<div className={classes.charts}>
				<ContainerLoader isLoading={loadingTokenInfo}>
					<Paper>
						<div className={classes.details}>
							<div className={classes.detail}>
								<p className={classes.titleDetail}>Liquidity</p>
								<p variant="body2" className={classes.dataDetail}>
									{formateNumberPrice(token.liquidity)}
								</p>
							</div>
							<div className={classes.detail}>
								<p className={classes.titleDetail}>Volume (24hrs)</p>
								<p variant="body2" className={classes.dataDetail}>
									{formateNumberPrice(token.volume_24h)}
								</p>
							</div>
							<div className={classes.detail}>
								<p className={classes.titleDetail}>Price</p>
								<p variant="body2" className={classes.dataDetail}>
									{formateNumberPriceDecimals(token.price, priceDecimals.current)}
								</p>
							</div>
						</div>
					</Paper>
				</ContainerLoader>
				<ContainerLoader className={classes.right} isLoading={loadingRateChart}>
					<Paper className={classes.right}>
						<div className={classes.chartHeader}>
							<div className={classes.chartData}>
								<p className={classes.textBig}>{dataHover.price}</p>
								<p>{dataHover.date}</p>
							</div>
							<div className={classes.groupButtons}>
								<ButtonGroup
									className={classes.groupButton}
									buttons={[
										{
											id: "price",
											name: "Rate",
											onClick: () => {
												onChangeTypeChart("price")
											},
										},
										{
											id: "liquidity",
											name: "Liquidity",
											onClick: () => {
												onChangeTypeChart("liquidity")
											},
										},
										{
											id: "volume",
											name: "Volume",
											onClick: () => {
												onChangeTypeChart("volume")
											},
										},
									]}
									active={selectTypeChart}
								/>
								<ButtonGroup
									style={selectTypeChart !== "price" ? { display: "none" } : {}}
									buttons={[
										{
											id: "7d",
											name: "7d",
											onClick: () => {
												onChangeRange("7d")
											},
										},
										{
											id: "1mo",
											name: "1m",
											onClick: () => {
												onChangeRange("1mo")
											},
										},
										{
											id: "1y",
											name: "1y",
											onClick: () => {
												onChangeRange("1y")
											},
										},
										{
											id: "all",
											name: "all",
											onClick: () => {
												onChangeRange("all")
											},
										},
									]}
									active={selectedRange}
								/>
								<ButtonGroup
									style={selectTypeChart !== "volume" ? { display: "none" } : {}}
									buttons={[
										{
											id: "d",
											name: "d",
											onClick: () => {
												onChangeRangeVolume("d")
											},
										},
										{
											id: "w",
											name: "w",
											onClick: () => {
												onChangeRangeVolume("w")
											},
										},
										{
											id: "m",
											name: "m",
											onClick: () => {
												onChangeRangeVolume("m")
											},
										},
									]}
									active={rangeVolume}
								/>
							</div>
						</div>
						<div className={classes.chart}>
							<CSSTransitionGroup transitionName="fade" transitionEnterTimeout={300} transitionLeaveTimeout={300}>
								{chartRender}
							</CSSTransitionGroup>
						</div>
					</Paper>
				</ContainerLoader>
			</div>
		</div>
	)
}

export default Token
