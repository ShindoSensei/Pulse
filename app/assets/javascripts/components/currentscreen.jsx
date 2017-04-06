/* globals React $ */

class CurrentSession extends React.Component {

  constructor () {
    super()
    this.state = {
      timerId: '',
      HrNotify: ''
    }
  }

  startTraining () {
    $.ajax({
      // GET to this url initiates the app to begin subscribing to MQTT broadcast
      url: '/start_training/' + this.props.currentTraining.id + '.json',
      method: 'GET',
      success: function (data) {
        this.props.currentSessionStatus('running')
        var intervalId = setInterval(function () {
          console.log('entering setInterval function')
          $.ajax({
            url: '/participants.json',
            method: 'GET',
            success: function (updatedParticipants) {
              // Returned data is array of participant objects updated with new heart rate
              console.log('received updated Participants from server' + updatedParticipants)
              this.props.updateCurrentParticipants(updatedParticipants)
            }.bind(this)
          })
        }.bind(this), 1000)

        this.setState({
          timerId: intervalId
        })
        console.log('IntervalId is ' + intervalId) // run
        console.log('this.state.timerId is ' + this.state.timerId) // run
      }.bind(this)

    })
    // Whenever heartRate crosses threshold, send alert to display
    // Disable all select buttons on upcoming screen & highlight currently running session
  }

  stopTraining () {
    // Stop interval of ajax call
    console.log('Entering stopTraining')
    clearInterval(this.state.timerId)
    $.ajax({
      url: '/stop_training/' + this.props.currentTraining.id + '.json',
      method: 'GET',
      success: function (data) {
        this.props.currentSessionStatus('ended')
        console.log('successfully stopped training')
      }.bind(this)
    })
    // Activate AAR box that pops up
    // Upon clicking stop session, add this training to history and remove from upcoming
  }

  componentWillReceiveProps () {
    let currentParticipants = this.props.currentParticipants
    let currentTrainees = this.props.currentTrainees
    let currentThreshold = this.props.threshold
    // alertParticipants is array of participants in danger
    let alertParticipants = currentParticipants.filter(function (part) {
      return part.heart_rate.slice(-1)[0] >= currentThreshold
    })

    alertParticipants.forEach(function (part) {
      console.log('alertParticipant obj is' + part)
    })

    if (alertParticipants.length > 0) {
      // If there are participants at risk, i.e. filled array, render below HrNotify
      let arrayOfRiskyTraineeIds = alertParticipants.map(function (part) {
        return part.trainee_id
      })

      let atRiskTrainees = currentTrainees.filter(function (trainee) {
        return arrayOfRiskyTraineeIds.includes(trainee.id)
      })

      var stringToPrint = 'Following in danger: '

      // atRiskTrainees.map(function (trainee, index) {
      //   return (
      //     <h3 key={index}>
      //       {trainee.first_name + ' ' + trainee.last_name + ' Heart Rate exceeded!'}
      //     </h3>
      //   )
      // })
      atRiskTrainees.forEach(function (trainee) {
        stringToPrint += trainee.first_name + ' '
      })
      this.setState({
        HrNotify: stringToPrint
      })
    } else {
      this.setState({
        HrNotify: ''
      })
    }
  }

  render () {
    let currentParticipants = this.props.currentParticipants
    let currentTrainees = this.props.currentTrainees

    let currentTraining = this.props.currentTraining
    let renderTrainees = currentTrainees.map(function (trainee, index) {
      let corresParticipant = currentParticipants.find(function (part) {
        return (part.trainee_id === trainee.id && part.training_id === currentTraining.id)
      })
      let lastHeartRate = corresParticipant.heart_rate.slice(-1)[0]
      return (
        <div key={index} className='col-sm-12'>
          <h4 className='text-white'>
            {trainee.first_name + ' ' + trainee.last_name + ': ' + lastHeartRate + '/' + (220 - trainee.age) + ' (' + Math.round((lastHeartRate / (220 - trainee.age)) * 100) + '%)' }
          </h4>
        </div>
      )
    })

    return (
      <div className='container'>
        <div className='row'>
          <div className='col-sm-8 col-sm-offset-2'>
            <div className='panel panel-default'>
              <div className='panel-heading'>
                <h1 className='panel-title text-white'>Current Session</h1>
              </div>
              <div className='panel-body'>
                <h3 className='text-white'>
                  Activity: {this.props.activityName + ' (Max ' + this.props.threshold + '%)'}
                </h3>
                <h3 className='text-white'>Location: {currentTraining.location}</h3>
                {renderTrainees}
                <div className='col-sm-12 text-center'>
                  <button className='button-clear' onClick={this.startTraining.bind(this)}>
                    <i className='fa fa-play-circle-o fa-5x text-white small-padding-right' aria-hidden='true' />
                  </button>
                  <i className='fa fa-spinner fa-pulse fa-3x fa-fw text-white' />
                  <button className='button-clear' onClick={this.stopTraining.bind(this)}>
                    <i className='fa fa-stop-circle-o fa-5x text-white' aria-hidden='true' />
                  </button>
                </div>

                  <div className='col-sm-12'>
                    <h3 className='text-white'>Notifications</h3>
                    <h4 className='text-white'>{this.state.HrNotify}</h4>
                  </div>
              </div>


          </div>
        </div>
      </div>
    </div>
    )
  }
}
